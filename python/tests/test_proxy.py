"""No network and no real token: the remote gateway is an in-process mock, and the stdio test
runs the server with APIFY_TOKEN removed from its environment."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest
from mcp import Client, StdioServerParameters, types
from mcp.server.lowlevel import Server

from etsy_sales_mcp import __version__
from etsy_sales_mcp.proxy import (
    LazyRemote,
    actor_name_to_tool_name,
    build_remote_url,
    create_proxy_server,
    load_static_tools,
    read_config,
    remote_headers,
    select_tools,
)
from etsy_sales_mcp.server import NAME

REPO_ROOT = Path(__file__).resolve().parents[2]
PKG = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
ACTORS = PKG["mcpProxy"]["actors"]
DOC = load_static_tools()
STATIC_TOOLS = select_tools(DOC["tools"], ACTORS)

pytestmark = pytest.mark.anyio


def mock_remote_server(calls: list) -> Server:
    async def on_list_tools(ctx, params):
        return types.ListToolsResult(
            tools=[
                types.Tool(name=actor_name_to_tool_name(a), description=f"mock {a}", input_schema={"type": "object"})
                for a in ACTORS
            ]
        )

    async def on_call_tool(ctx, params):
        calls.append(params)
        return types.CallToolResult(content=[types.TextContent(type="text", text=f"ok:{params.name}")])

    return Server("mock-apify", version="0.0.0", on_list_tools=on_list_tools, on_call_tool=on_call_tool)


def make_proxy(token, remote=None):
    async def connect(cfg):
        return remote

    get_remote = LazyRemote(read_config({"APIFY_TOKEN": token or ""}, ACTORS), connect)
    server = create_proxy_server(name=NAME, version=__version__, tools=STATIC_TOOLS, get_remote=get_remote)
    return server, get_remote


def test_tool_names_follow_apify_pattern():
    assert actor_name_to_tool_name("publicrecords/sports-odds-api") == "publicrecords--sports-odds-api"
    assert actor_name_to_tool_name("caffein.dev/ebay-sold-listings") == "caffein-dot-dev--ebay-sold-listings"
    assert len(actor_name_to_tool_name("a/" + "x" * 80)) == 64


def test_tools_json_one_well_formed_tool_per_actor_in_package_order():
    assert DOC["actors"] == ACTORS
    assert [t["name"] for t in STATIC_TOOLS] == [actor_name_to_tool_name(a) for a in ACTORS]
    for t in STATIC_TOOLS:
        assert len(t["description"]) > 80, t["name"]
        assert "When to use:" in t["description"]
        assert t["inputSchema"]["type"] == "object"
        assert isinstance(t["inputSchema"]["properties"], dict)
        for r in t["inputSchema"].get("required", []):
            assert r in t["inputSchema"]["properties"], (t["name"], r)
        assert t["annotations"]["readOnlyHint"] is True


def test_bundled_tools_json_matches_the_node_copy():
    bundled = (Path(__file__).resolve().parents[1] / "src" / "etsy_sales_mcp" / "tools.json").read_text(encoding="utf-8")
    assert bundled == (REPO_ROOT / "tools.json").read_text(encoding="utf-8"), (
        "python/src/etsy_sales_mcp/tools.json differs from tools.json; run python python/scripts/build_tools.py"
    )


def test_python_version_matches_package_json():
    assert __version__ == PKG["version"]


def test_build_remote_url_pins_the_package_actors():
    assert build_remote_url(ACTORS) == f"https://mcp.apify.com/?tools={','.join(ACTORS)}"


@pytest.mark.parametrize("bad", [[], ["no-slash"], ["a/b?x=1"]])
def test_build_remote_url_rejects_bad_actor_ids(bad):
    with pytest.raises(ValueError):
        build_remote_url(bad)


def test_read_config_does_not_require_a_token():
    assert read_config({}, ACTORS).token is None
    assert read_config({"APIFY_TOKEN": "  "}, ACTORS).token is None
    cfg = read_config({"APIFY_TOKEN": "test-token"}, ACTORS)
    assert cfg.token == "test-token"
    assert cfg.url == build_remote_url(ACTORS)
    assert cfg.overridden is False
    custom = read_config({"APIFY_MCP_URL": "http://localhost:9/mcp"}, ACTORS)
    assert custom.url == "http://localhost:9/mcp"
    assert custom.overridden is True


def test_token_goes_only_into_the_authorization_header():
    assert remote_headers("abc") == {"Authorization": "Bearer abc"}


async def test_tools_list_is_served_locally_without_a_token():
    server, get_remote = make_proxy(None)
    async with Client(server) as client:
        res = await client.list_tools()
        assert [t.name for t in res.tools] == [actor_name_to_tool_name(a) for a in ACTORS]
        assert res.tools[0].input_schema["properties"]
    assert get_remote.connects == 0


async def test_tools_call_without_a_token_returns_a_clear_error_and_never_connects():
    server, get_remote = make_proxy(None)
    async with Client(server) as client:
        res = await client.call_tool(actor_name_to_tool_name(ACTORS[0]), {})
    assert res.is_error is True
    assert "APIFY_TOKEN is not set" in res.content[0].text
    assert get_remote.connects == 0


async def test_tools_call_with_a_token_forwards_name_and_arguments_unchanged():
    calls: list = []
    async with Client(mock_remote_server(calls)) as remote:
        server, get_remote = make_proxy("test-token", remote)
        async with Client(server) as client:
            args = {"example": "value", "n": 3}
            name = actor_name_to_tool_name(ACTORS[0])
            res = await client.call_tool(name, args)
            assert res.content[0].text == f"ok:{name}"
            assert calls[0].arguments == args
            await client.call_tool(name, args)
    assert get_remote.connects == 1


async def test_unknown_tool_names_are_rejected_locally():
    async with Client(mock_remote_server([])) as remote:
        server, _ = make_proxy("test-token", remote)
        async with Client(server) as client:
            res = await client.call_tool("nope--nothing", {})
    assert res.is_error is True
    assert "Unknown tool" in res.content[0].text


async def test_stdio_server_initialize_and_tools_list_work_with_no_apify_token():
    env = {k: v for k, v in os.environ.items() if k != "APIFY_TOKEN"}
    env["APIFY_MCP_URL"] = "http://127.0.0.1:9/never-used"
    params = StdioServerParameters(command=sys.executable, args=["-m", "etsy_sales_mcp"], env=env)
    async with Client(params) as client:
        assert client.server_info is not None and client.server_info.name == NAME
        res = await client.list_tools()
        assert len(res.tools) == len(ACTORS)
        call = await client.call_tool(res.tools[0].name, {})
        assert call.is_error is True

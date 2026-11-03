"""Stdio MCP server for a fixed set of Apify Actors (Python version of src/proxy.js).

initialize and tools/list are answered locally from the bundled tools.json (no token, no network).
tools/call is forwarded to Apify's hosted MCP gateway (mcp.apify.com) with the caller's own APIFY_TOKEN.
"""

from __future__ import annotations

import json
import re
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from importlib import resources
from typing import Any
from urllib.parse import quote

from mcp import types
from mcp.server.lowlevel import Server

from .tool_names import actor_name_to_tool_name

__all__ = [
    "APIFY_MCP_BASE",
    "MISSING_TOKEN_MESSAGE",
    "Config",
    "NoTokenError",
    "LazyRemote",
    "actor_name_to_tool_name",
    "build_remote_url",
    "create_proxy_server",
    "load_static_tools",
    "read_config",
    "remote_headers",
    "select_tools",
]

APIFY_MCP_BASE = "https://mcp.apify.com/"

MISSING_TOKEN_MESSAGE = (
    "APIFY_TOKEN is not set. Listing tools works without a token, but running one starts an Apify Actor run "
    "on your own Apify account. Create a token at https://console.apify.com/settings/integrations and pass it "
    "as APIFY_TOKEN in the env block of your MCP client config."
)

INSTRUCTIONS = (
    "Each tool runs one Apify Actor and returns its dataset rows. Tool listing needs no credentials; "
    "calling a tool needs the user's own APIFY_TOKEN and starts an Actor run billed to that Apify account."
)

_ACTOR_ID = re.compile(r"^[\w.-]+/[\w.-]+$", re.ASCII)


class NoTokenError(RuntimeError):
    """Raised when a tool call needs the remote gateway but APIFY_TOKEN is not set."""


def build_remote_url(actors: Sequence[str], base: str = APIFY_MCP_BASE) -> str:
    """Build the Apify MCP gateway URL for a list of Actor ids ("owner/name")."""
    if not actors:
        raise ValueError("at least one Actor id is required")
    for a in actors:
        if not isinstance(a, str) or not _ACTOR_ID.match(a):
            raise ValueError(f"invalid Actor id: {a}")
    # Keep "/" and "," readable; Apify accepts both forms.
    return f"{base}?tools={quote(','.join(actors), safe='/,')}"


@dataclass(frozen=True)
class Config:
    token: str | None
    url: str
    actors: list[str]
    overridden: bool


def read_config(env: Mapping[str, str], default_actors: Sequence[str]) -> Config:
    """Read settings from an env mapping. The token is optional: without it the server still starts and lists tools.

    The token is the caller's own Apify token; it is only ever placed in the Authorization header, never logged.
    """
    token = (env.get("APIFY_TOKEN") or "").strip() or None
    raw_actors = env.get("APIFY_ACTORS") or ""
    actors_overridden = bool(raw_actors.strip())
    actors = [s.strip() for s in raw_actors.split(",") if s.strip()] if actors_overridden else list(default_actors)
    url_override = env.get("APIFY_MCP_URL") or ""
    url = url_override or build_remote_url(actors)
    return Config(token=token, url=url, actors=actors, overridden=actors_overridden or bool(url_override))


def remote_headers(token: str) -> dict[str, str]:
    """Headers for the remote transport (auth header only)."""
    return {"Authorization": f"Bearer {token}"}


def load_static_tools(path: str | None = None) -> dict[str, Any]:
    """Load the bundled tool list (tools.json). Returns the whole document: {"actors": [...], "tools": [...]}."""
    if path is None:
        text = resources.files(__package__).joinpath("tools.json").read_text(encoding="utf-8")
    else:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
    doc = json.loads(text)
    if not isinstance(doc, dict) or not isinstance(doc.get("tools"), list):
        raise ValueError("tools.json has no tools array")
    return doc


def select_tools(tools: Sequence[Mapping[str, Any]], actors: Sequence[str]) -> list[dict[str, Any]]:
    """Static tools for the configured Actors, in the configured order."""
    by_name = {t["name"]: dict(t) for t in tools}
    names = (actor_name_to_tool_name(a) for a in actors)
    return [by_name[n] for n in names if n in by_name]


def _error_result(text: str) -> types.CallToolResult:
    return types.CallToolResult(is_error=True, content=[types.TextContent(type="text", text=text)])


# A remote is anything with async list_tools() and call_tool(name, arguments) (an mcp.Client in practice).
GetRemote = Callable[[], Awaitable[Any]]


class LazyRemote:
    """Connect once on first use; retry on the next call if the connection failed. Never connects without a token."""

    def __init__(self, cfg: Config, connect: Callable[[Config], Awaitable[Any]]):
        self._cfg = cfg
        self._connect = connect
        self._remote: Any = None
        self.connects = 0

    async def __call__(self) -> Any:
        if not self._cfg.token:
            raise NoTokenError(MISSING_TOKEN_MESSAGE)
        if self._remote is None:
            self.connects += 1
            self._remote = await self._connect(self._cfg)
        return self._remote

    def peek(self) -> Any:
        """The connection if one was made, without starting one."""
        return self._remote


def create_proxy_server(
    *,
    name: str,
    version: str,
    tools: Sequence[Mapping[str, Any]],
    get_remote: GetRemote,
    list_from_remote: bool = False,
) -> Server[Any]:
    """Create the stdio-facing MCP server.

    - tools: static tool definitions served for tools/list.
    - get_remote(): async, returns a connected client for the gateway; raises NoTokenError if no token.
    - list_from_remote: when True (custom APIFY_ACTORS / APIFY_MCP_URL with a token), tools/list is forwarded.
    """
    static = [types.Tool.model_validate(t) for t in tools]
    known = [t.name for t in static]

    async def on_list_tools(ctx: Any, params: types.PaginatedRequestParams | None) -> types.ListToolsResult:
        if list_from_remote:
            try:
                remote = await get_remote()
                return await remote.list_tools(cursor=params.cursor if params else None)
            except Exception:
                pass  # fall back to the static list
        return types.ListToolsResult(tools=static)

    async def on_call_tool(ctx: Any, params: types.CallToolRequestParams) -> types.CallToolResult:
        tool_name = params.name
        if not list_from_remote and tool_name not in known:
            return _error_result(f'Unknown tool "{tool_name}". Available tools: {", ".join(known)}')
        try:
            remote = await get_remote()
        except NoTokenError:
            return _error_result(MISSING_TOKEN_MESSAGE)
        except Exception as err:  # noqa: BLE001
            return _error_result(f"Could not reach the Apify MCP gateway: {err}")
        return await remote.call_tool(tool_name, params.arguments)

    return Server(
        name,
        version=version,
        instructions=INSTRUCTIONS,
        on_list_tools=on_list_tools,
        on_call_tool=on_call_tool,
    )

"""Entry point: stdio MCP server. Lists tools from tools.json; forwards tools/call to Apify's hosted MCP gateway."""

from __future__ import annotations

import os
import sys
from typing import Any

import anyio
from mcp import Client
from mcp.client.streamable_http import streamable_http_client
from mcp.server.stdio import stdio_server
from mcp.client.streamable_http import create_mcp_http_client

from . import __version__
from .proxy import Config, LazyRemote, create_proxy_server, load_static_tools, read_config, remote_headers, select_tools

NAME = "etsy-sales-mcp"


async def _serve() -> None:
    doc = load_static_tools()
    cfg = read_config(os.environ, doc["actors"])
    tools = select_tools(doc["tools"], cfg.actors)

    # The remote connection is opened lazily on the first tool call, but it must be entered and
    # closed from one task, so a dedicated task owns it for the life of the server.
    async with anyio.create_task_group() as tg:
        stop = anyio.Event()

        async def connect(c: Config) -> Any:
            ready: dict[str, Any] = {}
            got = anyio.Event()

            async def owner() -> None:
                try:
                    http = create_mcp_http_client(headers=remote_headers(c.token or ""))
                    async with http, Client(streamable_http_client(c.url, http_client=http)) as client:
                        ready["client"] = client
                        got.set()
                        await stop.wait()
                except Exception as err:  # noqa: BLE001
                    ready["error"] = err
                    got.set()

            tg.start_soon(owner)
            await got.wait()
            if "error" in ready:
                raise ready["error"]
            return ready["client"]

        get_remote = LazyRemote(cfg, connect)
        server = create_proxy_server(
            name=NAME,
            version=__version__,
            tools=tools,
            get_remote=get_remote,
            list_from_remote=cfg.overridden and bool(cfg.token),
        )
        if not cfg.token:
            print(
                f"[{NAME}] APIFY_TOKEN not set: tools can be listed, tool calls will return an error until it is set.",
                file=sys.stderr,
            )
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())
        stop.set()


def main() -> None:
    try:
        anyio.run(_serve)
    except KeyboardInterrupt:
        pass
    except Exception as err:  # noqa: BLE001
        print(f"[{NAME}] failed to start: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

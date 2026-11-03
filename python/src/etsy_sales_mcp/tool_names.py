"""Tool naming that matches Apify's hosted MCP gateway (apify/apify-mcp-server, actorNameToToolName).

"owner/actor-name" -> "owner--actor-name", dots in the owner become "-dot-", max 64 chars.
"""

from __future__ import annotations

import hashlib
import re

MAX_TOOL_NAME_LENGTH = 64
TOOL_NAME_HASH_LENGTH = 4


def actor_name_to_tool_name(actor_full_name: str) -> str:
    normalized = re.sub(r"^([^~]+)~", r"\1/", actor_full_name, count=1)
    slash = normalized.find("/")
    if slash == -1:
        full_name = normalized
    else:
        full_name = f"{normalized[:slash].replace('.', '-dot-')}--{normalized[slash + 1:]}"
    if len(full_name) <= MAX_TOOL_NAME_LENGTH:
        return full_name
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:TOOL_NAME_HASH_LENGTH]
    return f"{full_name[: MAX_TOOL_NAME_LENGTH - TOOL_NAME_HASH_LENGTH - 1]}-{digest}"

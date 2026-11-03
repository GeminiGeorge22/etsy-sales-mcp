// Tool naming that matches Apify's hosted MCP gateway (apify/apify-mcp-server, actorNameToToolName):
// "owner/actor-name" -> "owner--actor-name", dots in the owner become "-dot-", max 64 chars.
import { createHash } from "node:crypto";

const MAX_TOOL_NAME_LENGTH = 64;
const TOOL_NAME_HASH_LENGTH = 4;

export function actorNameToToolName(actorFullName) {
  const normalized = actorFullName.replace(/^([^~]+)~/, "$1/");
  const slash = normalized.indexOf("/");
  const fullName =
    slash === -1
      ? normalized
      : `${normalized.slice(0, slash).replace(/\./g, "-dot-")}--${normalized.slice(slash + 1)}`;
  if (fullName.length <= MAX_TOOL_NAME_LENGTH) return fullName;
  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, TOOL_NAME_HASH_LENGTH);
  return `${fullName.slice(0, MAX_TOOL_NAME_LENGTH - TOOL_NAME_HASH_LENGTH - 1)}-${hash}`;
}

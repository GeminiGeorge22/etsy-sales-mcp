#!/usr/bin/env python3
"""Python port of scripts/build-tools.mjs: builds tools.json from each Actor's PUBLIC Apify data (no token).

  GET https://api.apify.com/v2/acts/<owner>~<name>                 (title, description)
  GET https://api.apify.com/v2/acts/<owner>~<name>/builds/default  (input schema of the default build)

Usage (from the repo root or python/):
  python python/scripts/build_tools.py                 -> write tools.json (repo root) and the bundled copy
  python python/scripts/build_tools.py --check         -> exit 1 if the bundled tools.json differs from the live schemas
  python python/scripts/build_tools.py --check --tools <file> -> compare <file> instead
      (CI self-test: test/fixtures/tools.drift-fixture.json must make --check exit 1)
Output is byte-identical to the Node script. Never sends an Authorization header; APIFY_TOKEN is ignored on purpose.
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
PY_ROOT = HERE.parent
REPO_ROOT = PY_ROOT.parent
sys.path.insert(0, str(PY_ROOT / "src"))

from etsy_sales_mcp.tool_names import actor_name_to_tool_name  # noqa: E402

BUNDLED = PY_ROOT / "src" / "etsy_sales_mcp" / "tools.json"
API = "https://api.apify.com/v2"
MAX_DESC = 500
WS = r"[\s\ufeff]"


def js_len(s: str) -> int:
    """String length in UTF-16 code units, like JavaScript's String.length."""
    return len(s.encode("utf-16-le")) // 2


def js_slice(s: str, n: int) -> str:
    """First n UTF-16 code units of s (like s.slice(0, n)); never splits a code point."""
    out, used = [], 0
    for ch in s:
        w = 2 if ord(ch) > 0xFFFF else 1
        if used + w > n:
            break
        out.append(ch)
        used += w
    return "".join(out)


def js_truthy(v: Any) -> bool:
    if v is None or v is False:
        return False
    if isinstance(v, (dict, list)):
        return True
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return v != 0
    if isinstance(v, str):
        return v != ""
    return bool(v)


def js_str(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    if isinstance(v, (list, dict)):
        return json.dumps(v, separators=(",", ":"), ensure_ascii=False)
    return str(v)


def js_typeof(v: Any) -> str:
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, (int, float)):
        return "number"
    if isinstance(v, str):
        return "string"
    return "object"


def _num(s: str) -> Any:
    f = float(s)
    return int(f) if f.is_integer() and abs(f) < 2**53 else f


def get_json(url: str) -> Any:
    attempt = 1
    while True:
        try:
            req = urllib.request.Request(url, headers={"accept": "application/json", "user-agent": "build-tools-py"})
            with urllib.request.urlopen(req, timeout=60) as res:
                return json.loads(res.read().decode("utf-8"), parse_float=_num)["data"]
        except Exception:
            if attempt >= 3:
                raise
            time.sleep(1.5 * attempt)
            attempt += 1


def js_trim(s: str) -> str:
    return re.sub(rf"^{WS}+|{WS}+$", "", s)


def clean(s: Any) -> str:
    s = "" if s is None else js_str(s)
    s = re.sub(r"<[^>]*>", " ", s)
    s = s.replace("&nbsp;", " ").replace("&amp;", "&")
    s = re.sub(rf"{WS}+", " ", s)
    return js_trim(s)


def cap(s: str, n: int = MAX_DESC) -> str:
    if js_len(s) <= n:
        return s
    return f"{re.sub(rf'{WS}+$', '', js_slice(s, n - 1))}…"


def clean_actor_text(s: Any) -> str:
    t = re.sub(rf"{WS}*\((?:[^)]*pay per[^)]*)\)", "", clean(s), flags=re.I)
    parts = re.split(rf"(?<=[.!?]){WS}+", t)
    keep = [x for x in parts if not re.search(r"pay[- ]per|\$|\bPPE\b|free trial|no limits!", x, flags=re.I)]
    return js_trim(" ".join(keep))


def clean_prop_text(s: Any) -> str:
    parts = re.split(rf"(?<=[.!?]){WS}+(?=[A-Z(])", clean(s))
    keep = [x for x in parts if not re.search(r"\$|pay[- ]per|\bPPE\b|free plan", x, flags=re.I)]
    return js_trim(" ".join(keep))


def item_type(prop: dict) -> Any:
    items = prop.get("items")
    if js_truthy(items) and isinstance(items, dict) and js_truthy(items.get("type")):
        return items["type"]
    if prop.get("editor") in ("stringList", "select"):
        return "string"
    if prop.get("editor") == "requestListSources":
        return "object"
    for v in (prop.get("default"), prop.get("prefill")):
        if isinstance(v, list) and v:
            return js_typeof(v[0])
    return None


def convert_items(prop: dict) -> dict:
    t = item_type(prop)
    items: dict[str, Any] = {}
    if js_truthy(t):
        items["type"] = t
    src = prop.get("items") if js_truthy(prop.get("items")) else {}
    if isinstance(src.get("enum"), list):
        items["enum"] = src["enum"]
    if prop.get("editor") == "requestListSources":
        items["type"] = "object"
        items["properties"] = {"url": {"type": "string", "description": "URL to process."}}
        items["required"] = ["url"]
    elif js_truthy(src.get("properties")):
        items["properties"] = src["properties"]
        if js_truthy(src.get("required")):
            items["required"] = src["required"]
    return items


def convert_property(prop: dict) -> dict:
    out: dict[str, Any] = {}
    if js_truthy(prop.get("title")):
        out["title"] = clean(prop["title"])
    desc = clean_prop_text(prop.get("description"))
    if isinstance(prop.get("enum"), list) and isinstance(prop.get("enumTitles"), list):
        titles = prop["enumTitles"]
        pairs = "; ".join(
            f"{js_str(v)} = {clean(titles[i] if i < len(titles) else None)}"
            for i, v in enumerate(prop["enum"])
        )
        if js_len(pairs) < 300:
            desc = f"{desc} Options: {pairs}." if desc else f"Options: {pairs}."
    if "prefill" in prop and "default" not in prop:
        ex = json.dumps(prop["prefill"], separators=(",", ":"), ensure_ascii=False)
        if js_len(ex) <= 160:
            desc = f"{desc} Example: {ex}" if desc else f"Example: {ex}"
    if desc:
        out["description"] = cap(desc)
    if js_truthy(prop.get("type")):
        out["type"] = prop["type"]
    if isinstance(prop.get("enum"), list):
        out["enum"] = prop["enum"]
    for k in ("minimum", "maximum", "minItems", "maxItems", "pattern"):
        if k in prop:
            out[k] = prop[k]
    if "default" in prop:
        out["default"] = prop["default"]
    if prop.get("type") == "array":
        items = convert_items(prop)
        if items:
            out["items"] = items
    if prop.get("type") == "object":
        if prop.get("editor") == "proxy":
            out["properties"] = {
                "useApifyProxy": {
                    "type": "boolean",
                    "description": "Use Apify Proxy for requests. Leave the default unless the Actor's README says otherwise.",
                    "default": True,
                }
            }
        elif js_truthy(prop.get("properties")):
            out["properties"] = prop["properties"]
    return out


def build_input_schema(schema: Any) -> dict:
    props = (schema.get("properties") if js_truthy(schema) else None) or {}
    properties = {k: convert_property(v) for k, v in props.items()}
    req = schema.get("required") if js_truthy(schema) else None
    required = [r for r in (req if isinstance(req, list) else []) if r in properties]
    out: dict[str, Any] = {"type": "object", "properties": properties}
    if required:
        out["required"] = required
    return out


def build_description(actor_id: str, act: dict, use_when: Any) -> str:
    title = clean_actor_text(act.get("title") or actor_id)
    what = clean_actor_text(act.get("description") or "")
    parts = [
        js_trim(f"{title}. {what}"),
        f"When to use: {use_when}" if js_truthy(use_when) else None,
        "Returns: the run's dataset rows as structured JSON (one row per result), plus the run and dataset IDs for paging the full dataset.",
        f'Behavior: starts one run of the Apify Actor "{actor_id}" through Apify\'s hosted MCP gateway (mcp.apify.com) with your own APIFY_TOKEN; the run uses your Apify account. Read-only: it only reads public web data and changes nothing on the source site. Docs: https://apify.com/{actor_id}',
    ]
    return "\n\n".join(p for p in parts if p)


def build_tool(actor_id: str, meta: dict) -> dict:
    slug = actor_id.replace("/", "~", 1)
    act = get_json(f"{API}/acts/{slug}")
    build = get_json(f"{API}/acts/{slug}/builds/default")
    schema = build.get("inputSchema")
    if isinstance(schema, str):
        schema = json.loads(schema, parse_float=_num)
    title = cap(clean_actor_text(act.get("title") or actor_id), 120)
    return {
        "name": actor_name_to_tool_name(actor_id),
        "title": title,
        "description": build_description(actor_id, act, meta.get(actor_id)),
        "inputSchema": build_input_schema(schema),
        "annotations": {
            "title": title,
            "readOnlyHint": True,
            "destructiveHint": False,
            "idempotentHint": False,
            "openWorldHint": True,
        },
    }


def main(argv: list[str]) -> int:
    pkg = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    meta = json.loads((REPO_ROOT / "tools.meta.json").read_text(encoding="utf-8"))
    actors = pkg["mcpProxy"]["actors"]
    check = "--check" in argv
    tools = [build_tool(a, meta) for a in actors]
    doc = {
        "$comment": "Generated by scripts/build-tools.mjs from each Actor's public Apify input schema. Do not edit by hand; run `npm run build:tools`.",
        "actors": actors,
        "tools": tools,
    }
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if "--tools" in argv and argv.index("--tools") + 1 < len(argv):
        target = Path(argv[argv.index("--tools") + 1]).resolve()
    else:
        target = BUNDLED
    if not check:
        for p in {target, REPO_ROOT / "tools.json"}:
            p.write_text(text, encoding="utf-8")
        print(f"tools.json: {len(tools)} tools written")
        return 0
    current = target.read_text(encoding="utf-8") if target.exists() else ""
    if current == text:
        print(f"{target.name} matches the live public input schemas ({len(tools)} tools).")
        return 0
    old = json.loads(current).get("tools", []) if current else []
    old_by = {t["name"]: json.dumps(t, sort_keys=True) for t in old}
    drifted = [t["name"] for t in tools if old_by.get(t["name"]) != json.dumps(t, sort_keys=True)]
    names = {t["name"] for t in tools}
    removed = [t["name"] for t in old if t["name"] not in names]
    print(
        f"{target.name} drift detected. Changed: {', '.join(drifted) or 'none'}. Removed: {', '.join(removed) or 'none'}.",
        file=sys.stderr,
    )
    print("Run `python python/scripts/build_tools.py` (or `npm run build:tools` and copy), review the diff and commit.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except SystemExit:
        raise
    except Exception as err:  # noqa: BLE001
        print(f"build-tools failed: {err}", file=sys.stderr)
        sys.exit(2)

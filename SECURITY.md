# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's
[private vulnerability reporting](../../security/advisories/new) for this repository
rather than opening a public issue. You should get a reply within a few days.

## Credentials

This server reads your own `APIFY_TOKEN` from the environment and sends it only to
Apify's MCP gateway (`https://mcp.apify.com`) as a Bearer token. It never writes the
token to disk or logs. Never commit a real token to a config file or issue.

# Container image for the stdio MCP server (used by Glama, Docker MCP Catalog and other MCP directories).
# Lists tools without credentials; running a tool needs your own APIFY_TOKEN:
#   docker run -i --rm -e APIFY_TOKEN=... <image>
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
COPY tools.json ./
ENV NODE_ENV=production
USER node
ENTRYPOINT ["node", "src/server.js"]

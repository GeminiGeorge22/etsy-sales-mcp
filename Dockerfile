# Container image for the stdio MCP proxy (used by Glama and other MCP directories to build and inspect the server).
# Runtime requires your own APIFY_TOKEN: docker run -i --rm -e APIFY_TOKEN=... <image>
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
ENV NODE_ENV=production
ENTRYPOINT ["node", "src/server.js"]

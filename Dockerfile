FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install
COPY . .
RUN bun run scripts/fetch-data.ts
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]

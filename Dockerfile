FROM node:18-slim AS prisma-builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm install --no-fund --no-audit prisma @prisma/client
RUN npx prisma generate

FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y \
     curl \
     && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
     && apt-get install -y nodejs \
     && apt-get clean \
     && rm -rf /var/lib/apt/lists/*

RUN node -v && bun -v

COPY . .
COPY --from=prisma-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prisma-builder /app/node_modules/prisma ./node_modules/prisma

RUN bun install

EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "-c", "bun src/index.ts"]
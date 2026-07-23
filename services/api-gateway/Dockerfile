# API Gateway — NestJS service
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
COPY ../../pnpm-workspace.yaml ../../package.json /app/
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source
COPY . .

# Build
RUN pnpm build 2>/dev/null || true

EXPOSE 4000
CMD ["node", "dist/main.js"]

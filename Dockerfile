FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

EXPOSE 3000 5173 8787

CMD ["pnpm", "dev"]
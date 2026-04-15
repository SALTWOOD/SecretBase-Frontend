FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY . .

RUN npm run build --workspace=frontend

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/frontend/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

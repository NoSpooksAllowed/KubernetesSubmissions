FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

ENV PORT=3000
EXPOSE ${PORT}

ENV NODE_ENV=production

RUN adduser --system node-app \
  && chown node-app . 

USER node-app

CMD ["node", "src/index.js"]

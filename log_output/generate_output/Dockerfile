FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

FROM node:20-slim

RUN adduser --system nodejs -u 101 \ 
  && addgroup --system nodejs --gid 101 \
  && chown nodejs . 

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/*.js ./ 

ENV NODE_ENV=production

USER nodejs

CMD ["node", "index.js"]

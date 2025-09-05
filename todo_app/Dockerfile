FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

FROM node:20-slim

WORKDIR /usr/src/app

RUN  addgroup --system nodejs --gid 101 \
  adduser --system nodejs -u 101 --ingroup nodejs nodejs\
  && chown nodejs:nodejs .

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/src ./src 

ENV PORT=3000
EXPOSE ${PORT}

ENV NODE_ENV=production

USER nodejs

CMD ["node", "src/index.js"]

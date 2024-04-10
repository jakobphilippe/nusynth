FROM node:20.12.1-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json svelte.config.js ./
RUN npm i

COPY . .
RUN npm run build

FROM node:20.12.1-alpine as runner

ENV NODE_ENV production
USER node
WORKDIR /app

COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json .

EXPOSE 3000
CMD ["node","/app/build/index.js"]

FROM node:14-alpine as builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./
RUN npm ci
COPY src src
RUN npm run build

FROM node:14-alpine as release

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist dist
COPY package*.json tsconfig.json ./
COPY scripts scripts

RUN npm ci --production=1 && \
    rm -rf ~/.npm && \
    wget https://install.goreleaser.com/github.com/tj/node-prune.sh && \ 
    sh node-prune.sh && \
    ./bin/node-prune && \
    ./scripts/clean

ENTRYPOINT ["npm", "run", "start"]
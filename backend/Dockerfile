FROM node:20-alpine

WORKDIR /server

RUN apk add --no-cache python3 make g++ openjdk11-jre-headless

COPY package.json yarn.lock* ./

RUN corepack enable && corepack prepare yarn@4.12.0 --activate
RUN yarn install

COPY . .

RUN yarn medusa build

RUN chmod +x start.sh

EXPOSE 9000
EXPOSE 5173

CMD ["sh", "./start.sh"]

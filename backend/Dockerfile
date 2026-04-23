FROM node:20-alpine

WORKDIR /server

RUN apk add --no-cache python3 make g++ openjdk11-jre-headless

# Enable Corepack for Yarn v4
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy Yarn configuration and lockfile
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn .yarn

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build Medusa Admin
RUN yarn medusa build

# Copy admin build output to the path Medusa server expects
RUN mkdir -p /server/public && cp -r /server/.medusa/server/public/admin /server/public/admin

RUN chmod +x start.sh

EXPOSE 9000
EXPOSE 5173

CMD ["sh", "./start.sh"]

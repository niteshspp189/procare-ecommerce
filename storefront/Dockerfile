FROM node:20-alpine

WORKDIR /app

# Install necessary build tools if needed
RUN apk add --no-cache python3 make g++

# Copy Yarn configuration and lockfile
COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn .yarn

# Next.js starter uses Yarn v4 (Berry)
RUN corepack enable && corepack prepare yarn@4.12.0 --activate
RUN yarn install

COPY . .

RUN chmod +x start.sh

EXPOSE 8000

CMD ["sh", "./start.sh"]

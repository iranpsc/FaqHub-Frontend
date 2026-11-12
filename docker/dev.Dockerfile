# Local Next.js image. Source and node_modules are mounted by docker-compose.dev.yml.
FROM node:20-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

EXPOSE 3000

CMD ["sh", "-c", "if [ ! -x node_modules/.bin/next ]; then npm ci; fi && npm run dev -- --hostname 0.0.0.0 --port 3000"]

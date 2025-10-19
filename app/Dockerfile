# Build stage
FROM node:18-bullseye-slim AS builder

# update OS packages to pick up security fixes, install minimal ca-certificates,
# and clean apt lists to keep the image small
RUN set -eux; \
	apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y --no-install-recommends ca-certificates && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

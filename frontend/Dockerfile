FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build - API URL will be set via environment variable at runtime
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Create entrypoint script to inject API URL at runtime
RUN echo '#!/bin/sh' > /docker-entrypoint-custom.sh && \
    echo 'if [ -n "$BACKEND_URL" ]; then' >> /docker-entrypoint-custom.sh && \
    echo '  sed -i "s|BACKEND_PLACEHOLDER|$BACKEND_URL|g" /etc/nginx/nginx.conf' >> /docker-entrypoint-custom.sh && \
    echo 'fi' >> /docker-entrypoint-custom.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint-custom.sh && \
    chmod +x /docker-entrypoint-custom.sh

EXPOSE 5173

CMD ["/docker-entrypoint-custom.sh"]

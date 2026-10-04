FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json turbo.json ./
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/

RUN npm install

COPY shared ./shared
COPY client ./client

# Provide build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npx turbo run build --filter=@codesync/client

FROM nginx:alpine AS runner

# Copy built assets to Nginx
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Add custom Nginx config for React Router fallback
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

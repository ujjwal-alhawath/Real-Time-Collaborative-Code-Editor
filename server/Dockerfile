FROM node:20-alpine AS builder

# Enable corepack for pnpm/yarn/npm compatibility if needed
RUN corepack enable

WORKDIR /app

# Copy root configurations
COPY package*.json turbo.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install all dependencies (dev included for build)
RUN npm install

# Copy source code
COPY shared ./shared
COPY server ./server

# Build the server and shared packages
RUN npx turbo run build --filter=@codesync/server

FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start", "-w", "@codesync/server"]

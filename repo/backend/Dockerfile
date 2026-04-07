# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first for layer-cache efficiency
COPY package*.json ./
RUN npm ci

# Generate Prisma client against the schema (no DATABASE_URL needed here)
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript using the production tsconfig
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# curl is needed for the Docker healthcheck; openssl is needed for Prisma engine detection
RUN apk add --no-cache curl openssl

# Copy only what the runtime needs
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma      ./prisma

# Startup script: runs migrations → seed → server
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

EXPOSE 3000

CMD ["./startup.sh"]

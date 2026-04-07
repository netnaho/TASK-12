# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (cache layer before copying source)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# VITE_API_BASE_URL is baked into the JS bundle at build time.
# Default is empty string: the Axios client then falls back to '/api',
# and nginx proxies /api/ → the backend container.
# Pass a full URL (e.g. http://myserver:3000/api) only when the backend
# is not behind the same nginx.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

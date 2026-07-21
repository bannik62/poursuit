# ── Build admin ──
FROM node:22-alpine AS admin-build
WORKDIR /app
COPY frontend/admin/package.json frontend/admin/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/admin/ .
RUN npm run build

# ── Build plateau ──
FROM node:22-alpine AS plateau-build
WORKDIR /app
COPY shared ./shared
COPY frontend/plateau/package.json frontend/plateau/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/plateau/ .
RUN npm run build

# ── Build joueur ──
FROM node:22-alpine AS joueur-build
WORKDIR /app
COPY shared ./shared
COPY frontend/joueur/package.json frontend/joueur/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/joueur/ .
RUN npm run build

# ── Nginx : 3 apps + proxy API ──
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=admin-build /app/dist /usr/share/nginx/html/admin
COPY --from=plateau-build /app/dist /usr/share/nginx/html/plateau
COPY --from=joueur-build /app/dist /usr/share/nginx/html/joueur
EXPOSE 80

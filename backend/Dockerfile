FROM node:22-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install --omit=dev
COPY shared ./shared
COPY backend/src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]

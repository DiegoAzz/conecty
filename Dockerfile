FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY server.js ./
COPY public/ ./public/
COPY agent/ ./agent/

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]

# Multi-stage build para Backend BlogWEB
# Stage 1: Builder - Instalar dependencias de producción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Stage 2: Runtime - Imagen final optimizada
FROM node:20-alpine

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copiar node_modules desde el stage builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 8080

# Healthcheck - crítico para deploys
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar usuario 'node' por seguridad (no root)
USER node

# Comando de inicio
CMD ["node", "server.js"]

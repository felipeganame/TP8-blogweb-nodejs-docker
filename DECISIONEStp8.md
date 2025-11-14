
## 🔄 Pipeline CI/CD

### ¿Por qué GitHub Actions en vez de Azure Pipelines?

**Razones principales:**
1. **Nativo con el código:** Todo en `.github/workflows/` - versionado junto al proyecto
2. **Gratuito para repos públicos:** 2000 min/mes gratis vs Azure DevOps con límites más restrictivos
3. **Integración perfecta con GHCR:** GitHub Container Registry incluido sin configuración extra
4. **Marketplace enorme:** Miles de actions listas para usar (Docker, SonarCloud, etc.)
5. **Menos configuración:** No necesitas Service Connections, todo con `secrets.GITHUB_TOKEN`
6. **YAML más simple:** Sintaxis más limpia que Azure Pipelines

**Comparación:**
```
Azure Pipelines:
- Service Connections manuales
- Variables Groups separados
- Pool de agentes a configurar
- Templates complejos

GitHub Actions:
- Secrets en Settings
- env: directo en YAML
- Runners automáticos
- Actions del Marketplace
```

### ¿Por qué Render.com en vez de Azure App Services?

**Decisión clave: Free tier real + Docker nativo**

| Feature | Azure App Services | Render.com |
|---------|-------------------|------------|
| **Free Tier** | 60 min/día F1 | Siempre gratis (con sleep) |
| **Docker Support** | Complejo (ACR + configs) | Nativo desde GHCR |
| **Setup** | Portal + CLI | Solo blueprint YAML |
| **Cold Start** | 1-2 min | 30-60 seg |
| **Environments** | Manual | Built-in (Preview/Prod) |
| **Precio PROD** | ~$55/mes Basic | $7/mes Starter |

**Ventajas de Render:**
- 🐳 Pull directo desde `ghcr.io` - cero configuración
- 🔄 Auto-deploy desde GitHub - webhooks incluidos
- 🌍 CDN global incluido
- 📊 Logs en tiempo real sin configurar nada
- 💰 Free tier real para estudiantes/demos

**Desventajas asumidas:**
- Cold start de 30-60seg en free tier (aceptable para TP)
- Menos features enterprise que Azure (no los necesitamos)

### 5 Stages Secuenciales

```
Stage 1: Build + Tests Unitarios + SonarCloud
    ↓
Stage 2: Tests E2E (Cypress)
    ↓
Stage 3: Build & Push Docker Images (GHCR)
    ↓
Stage 4: Deploy QA (Render.com)
    ↓
Stage 5: Deploy PROD (Render.com + Manual Approval)
```

**¿Por qué 5 stages?**

1. **Stage 1 - Build/Test/Analysis**
   - ✅ Fallo rápido: si los unit tests fallan, paramos todo
   - ✅ Coverage reports: vemos qué tan bien testeamos
   - ✅ SonarCloud: detección temprana de code smells

2. **Stage 2 - Integration Tests (Cypress)**
   - ✅ Validación end-to-end: ¿funciona realmente el flujo completo?
   - ✅ Separado de unit tests: no mezclamos tests rápidos con lentos
   - ✅ Genera screenshots/videos: debugging visual

3. **Stage 3 - Docker Build & Push** ⭐ NUEVO
   - ✅ Containerización: mismo ambiente en dev/qa/prod
   - ✅ GHCR: registro de imágenes gratis con GitHub
   - ✅ Multi-stage builds: imágenes optimizadas (<200MB)
   - ✅ Cache layers: builds incrementales rápidos

4. **Stage 4 - Deploy QA**
   - ✅ Ambiente de pruebas: validar antes de PROD
   - ✅ BD separada: no contaminar datos de producción
   - ✅ Health checks: verificar que levantó bien

5. **Stage 5 - Deploy PROD**
   - ✅ Manual approval: control humano antes de PROD
   - ✅ Mismo Docker image: lo que funcionó en QA va a PROD
   - ✅ Rollback fácil: solo cambiar tag de imagen

**¿Por qué NO 3 stages como Azure?**
- Azure Pipelines: Build + Test en 1, Deploy QA, Deploy PROD
- GitHub Actions + Docker: Necesitamos stage extra para containerizar
- Beneficio: Mayor granularidad y control

### Health Checks con Reintentos

```bash
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend respondiendo correctamente"
    break
  fi
  
  ATTEMPT=$((ATTEMPT+1))
  echo "⏳ Intento $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 2
done
```

**¿Por qué?**
- Los servicios Node.js tardan 10-20s en levantar
- Render.com free tier tiene cold start de 30-60s
- Sin reintentos = falsos negativos constantemente
- 30 intentos × 2s = 60s timeout total (razonable)

---

## 🐳 Docker y Containerización

### ¿Por qué Docker?

**Antes (Azure App Services directo):**
```bash
- Subir ZIP con código
- Azure instala node_modules en el servidor
- Problemas: "works on my machine"
- Diferentes versiones de Node entre dev/prod
```

**Ahora (Docker):**
```bash
- Build imagen con todo incluido
- Misma imagen en dev/qa/prod
- Garantía de consistencia
- Portable a cualquier cloud
```

### Multi-Stage Builds

**Dockerfile Backend:**
```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 8080
USER node
CMD ["node", "server.js"]
```

**Beneficios:**
- ✅ Imagen final: 221MB (vs 500MB+ sin multi-stage)
- ✅ Solo dependencias de producción en runtime
- ✅ No lleva cache de npm, tests, coverage
- ✅ Usuario `node` (no root) = más seguro

### GitHub Container Registry (GHCR)

**¿Por qué GHCR en vez de Docker Hub?**

| Feature | Docker Hub | GHCR |
|---------|-----------|------|
| **Integración GitHub** | Manual | Automática |
| **Free Tier** | 1 private repo | Unlimited private |
| **Auth en Actions** | Token externo | `secrets.GITHUB_TOKEN` |
| **Location** | Public | Con el código |

**Uso:**
```yaml
registry: ghcr.io
image: ghcr.io/felipeganame/blogweb-backend:latest
```

Sin configuración extra - solo funciona™

### .dockerignore

```dockerignore
node_modules
coverage/
test-results/
__tests__/
*.test.js
*.md
.git
.env
```

**¿Por qué crítico?**
- Build context de 500MB → 5MB
- Build time: 2 min → 15 seg
- No subir secrets accidentalmente

---

## 🚀 Deploy Strategy

### Render.com: Blueprint as Code

**render.yaml** (ejemplo):
```yaml
services:
  - type: web
    name: blogweb-backend
    env: docker
    dockerfilePath: ./BlogWEB/backend/Dockerfile
    envVars:
      - key: COSMOSDB_CONNECTION_STRING
        sync: false  # Secret
      - key: NODE_ENV
        value: production
```

**Ventajas:**
- Infrastructure as Code
- Versionado con el proyecto
- Reproducible en otros proyectos

### Deploy Hooks

```yaml
- name: 🚀 Trigger Render Deploy - Backend QA
  run: |
    curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_BACKEND_QA }}"
```

**¿Por qué hooks en vez de Git triggers?**
- Control fino: decidimos cuándo deployar
- No deploy en cada commit (solo después de tests)
- Separación: QA auto, PROD manual

### Estrategia de Tags

```yaml
tags: |
  ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:latest
  ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:${{ github.sha }}
```

**2 tags por imagen:**
- `latest`: Siempre la última versión
- `sha`: Inmutable, para rollback exacto

**Rollback:**
```bash
# Si PROD falla, volver a versión anterior
render deploy --image ghcr.io/felipeganame/blogweb-backend:abc123
```

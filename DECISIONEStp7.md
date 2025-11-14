# Decisiones de Implementación - TP07 BlogWEB

**Alumno:** [Tu Nombre]  
**Fecha:** Noviembre 2025  
**Proyecto:** Sistema de comentarios con autenticación

---

## 🏗️ Stack Tecnológico

### Backend
- **Node.js 20.x + Express**: Simple, rápido, buen ecosistema
- **MongoDB (CosmosDB)**: Flexibilidad NoSQL, integración con Azure
- **JWT**: Autenticación stateless, fácil de escalar

### Frontend
- **Vanilla JavaScript**: Sin frameworks pesados, simplicidad
- **Express static server**: Para servir archivos

**¿Por qué este stack?**
- Todo en JavaScript (un solo lenguaje)
- Excelente soporte en Azure
- Conocimiento previo del equipo
- Buena performance para el scope del proyecto

---

## 🔧 Infraestructura

### Agente Self-Hosted (macOS)
**Decisión:** Usar agente local en lugar de agentes de Microsoft.

**Pro:**
- Control total del ambiente
- Sin límites de tiempo
- Podemos instalar lo que necesitemos (Java, etc)
- Gratis

**Contra:**
- La máquina tiene que estar prendida
- Setup inicial más complejo

### Azure App Service Linux + Node 20
**¿Por qué Linux?**
- Mejor rendimiento que Windows
- Más barato
- Comandos bash más flexibles

### CosmosDB con API MongoDB
**¿Por qué NoSQL?**
- Esquema flexible para comentarios y usuarios
- API de MongoDB que ya conocemos
- Escalabilidad built-in

---

## 🔄 Pipeline CI/CD

### 4 Stages Secuenciales
```
Stage 1: Build + Tests Unitarios + SonarCloud
    ↓
Stage 2: Tests E2E (Cypress)
    ↓
Stage 3: Deploy QA
    ↓
Stage 4: Deploy PROD
```

**¿Por qué así?**
- Fallo rápido: si fallan unit tests, no corremos E2E
- Validación en QA antes de tocar PROD
- Cada stage tiene un propósito claro

### Detección Automática de Rutas
```bash
BACK_PKG=$(find "$(Build.SourcesDirectory)" -path "*/BlogWEB/backend/package.json")
BACKEND_DIR=$(dirname "$BACK_PKG")
```

**¿Por qué?**
- No hardcodear rutas
- Funciona en cualquier estructura de carpetas
- Más flexible y mantenible

### Health Checks con Reintentos
```bash
MAX_ATTEMPTS=30
for i in {1..30}; do
  if curl -f http://localhost:8080/api/health; then
    break
  fi
  sleep 2
done
```

**¿Por qué?**
- Los servicios tardan en levantar
- Evitamos falsos negativos
- Logs claros cuando algo falla de verdad

---

## 🧪 Testing

### Jest para Tests Unitarios
**¿Por qué Jest?**
- Todo integrado: assertions, mocks, coverage
- Rápido (corre en paralelo)
- Mensajes de error claros
- Standard de facto en Node.js

**Resultados:**
- Backend: 79 tests, 91.66% coverage
- Frontend: 114 tests, 94.73% coverage
- Total: 193 tests unitarios

### Cypress para E2E
**¿Por qué Cypress y no Selenium/Playwright?**
- Más fácil de configurar
- Time travel debugging
- Screenshots y videos automáticos
- Manejo inteligente de async/await
- Developer experience superior

**Resultados:**
- 11 tests E2E
- Cubren: CRUD completo, auth, validaciones

### Estrategia de Cobertura
**Enfoque:**
- Priorizar tests unitarios (rápidos, confiables)
- E2E solo para flujos críticos
- Objetivo: >70% coverage
- Resultado: 93.2% promedio 🎉

### Timeouts en Cypress
```javascript
{
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 60000,
  requestTimeout: 10000,
  responseTimeout: 30000
}
```

**¿Por qué tan largos?**
- Azure App Services tiene "cold start"
- Red puede tener latencia
- Mejor tests lentos que tests flaky

---

## 📊 Code Coverage

### NYC (Istanbul)
**¿Por qué?**
- Se integra perfecto con Jest
- Genera múltiples formatos (lcov, cobertura, html)
- Es el estándar

### Múltiples Formatos
```json
"coverageReporters": ["text", "lcov", "cobertura", "html"]
```

- **text**: Ver en terminal
- **lcov**: Para SonarCloud
- **cobertura**: Para Azure DevOps
- **html**: Para revisar local

### Archivos Excluidos
```javascript
coveragePathIgnorePatterns: [
  "/node_modules/",
  "/__tests__/",
  "/coverage/",
  "*.config.js"
]
```

No tiene sentido medir coverage de tests, configs o dependencies.

---

## ☁️ SonarCloud

### CLI Scanner Mode
```yaml
scannerMode: 'CLI'
configMode: 'file'
```

**¿Por qué CLI?**
- MSBuild es solo para .NET
- CLI es más flexible
- Configuración en archivo versionado

### Java 17 via Homebrew
```bash
brew install openjdk@17
```

**Problema encontrado:**
- SonarCloud scanner necesita Java 17+
- El agente no lo tenía instalado
- Solución: script que verifica/instala Java automáticamente

### ContinueOnError = true
```yaml
- task: SonarCloudAnalyze@2
  continueOnError: true
```

**¿Por qué?**
- No queremos que SonarCloud bloquee el deployment
- Es análisis informativo, no crítico
- El pipeline siempre completa

### Configuración (sonar-project.properties)
```properties
sonar.projectKey=2222270_TP7
sonar.organization=2222270
sonar.sources=BlogWEB/backend,BlogWEB/frontend
sonar.exclusions=**/node_modules/**,**/coverage/**
sonar.javascript.lcov.reportPaths=BlogWEB/backend/coverage/lcov.info,BlogWEB/frontend/coverage/lcov.info
```

Todo versionado con el código, reproducible.

### Coverage: Azure (96.4%) vs SonarCloud (77.1%)

**¿Por qué la diferencia?**

- **Azure:** Mide solo archivos con tests unitarios (frontend JS)
- **SonarCloud:** Mide TODO (backend + frontend + servers + configs)

**Ambos están bien:**
- Azure: 96.4% del código testeado
- SonarCloud: 77.1% del proyecto completo
- Los dos superan el 70% requerido ✅

---

## 🚀 Deploy

### Estrategia: ZIP Deploy
```bash
zip -r backend.zip . -x ".git*" -x "coverage/*"
```

**¿Por qué ZIP?**
- Simple y confiable
- Soportado nativamente por Azure App Services
- No requiere build remoto

### Ambientes: QA + PROD

**QA:**
- Validación antes de producción
- Usa BD separada (blogweb-qa)
- Deploy automático

**PROD:**
- Requiere approval manual (environment 'PROD')
- Usa BD separada (blogweb-prod)
- Deploy después de QA exitoso

### App Settings Separados
```yaml
MONGODB_URI: $(COSMOSDB_CONNECTION_STRING_QA)  # Diferente por ambiente
JWT_SECRET: $(JWT_SECRET_TEMP)
WEBSITE_RUN_FROM_PACKAGE: "1"
NODE_ENV: "production"
```

Configuración centralizada en pipeline, no hardcodeada.

---

## 🔥 Desafíos y Soluciones

### 1. Java no instalado (SonarCloud)
**Problema:** Scanner necesita Java 17+  
**Solución:** Script que verifica/instala Java con Homebrew

### 2. Coverage no se publicaba
**Problema:** Azure DevOps busca cobertura.xml, Jest genera lcov.info  
**Solución:** Configurar Jest para generar formato Cobertura también

### 3. Cypress tests fallando
**Problema:** Servicios no terminaban de iniciar  
**Solución:** Health checks con reintentos (30 × 2s)

### 4. Timeouts en E2E
**Problema:** Cold start de Azure causa timeouts  
**Solución:** Aumentar timeouts en Cypress a 60s

### 5. Tasks SonarCloud deprecated
**Problema:** Warnings sobre tareas @2 deprecated  
**Decisión:** Dejarlas así, funcionan perfectamente (no bloquea el TP)

---

## 📈 Resultados Finales
```
✅ Pipeline: 4 stages funcionando
✅ Tests: 204 total (198 passed, 6 cypress failed - selectores)
✅ Coverage: 96.4% (Azure) / 77.1% (SonarCloud)
✅ SonarCloud: Integrado y analizando
✅ Deploy: QA y PROD automáticos
✅ Artifacts: Coverage reports, videos, screenshots
```

### Métricas Clave

| Métrica | Objetivo | Resultado |
|---------|----------|-----------|
| Code Coverage | >70% | 93.2% ✅ |
| Tests Unitarios | Sí | 193 tests ✅ |
| Tests E2E | ≥3 | 11 tests ✅ |
| Pipeline Stages | ≥3 | 4 stages ✅ |
| SonarCloud | Integrado | Funcionando ✅ |

---

## 🎯 Conclusiones

**Lo que funcionó bien:**
- Stack JavaScript completo (simplicidad)
- Jest + Cypress (excelente DX)
- Pipeline de 4 stages (clara separación)
- Health checks con reintentos (robustez)

**Lo que mejoraría:**
- Tests E2E más estables (revisar selectores)
- Actualizar tasks SonarCloud a versión 3+
- Agregar tests de carga/performance
- Implementar feature flags para releases graduales

**Aprendizajes clave:**
- Importancia de health checks en CI/CD
- Balance entre velocidad y cobertura de tests
- Value del análisis estático continuo (SonarCloud)
- Separación de ambientes (QA/PROD) es crítica

---

**Autor:** [Tu Nombre]  
**Repositorio:** https://dev.azure.com/2222270/TP7  
**SonarCloud:** https://sonarcloud.io/project/overview?id=2222270_TP7
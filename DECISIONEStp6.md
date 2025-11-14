# Decisiones: Tests Unitarios y Pipeline CI/CD

## 🧪 Herramientas de Testing

### **Jest 29.7.0** - Framework principal
- Ejecutor de tests para JavaScript/Node.js
- Generador de reportes de coverage
- Sistema de mocking integrado

### **Backend**
- **Supertest 7.1.4** - Testing de API REST sin levantar servidor real
- **mongodb-memory-server 10.3.0** - Base de datos MongoDB en memoria para tests aislados
- **jest-junit 16.0.0** - Reportes en formato JUnit XML para Azure DevOps

### **Frontend**
- **jest-environment-jsdom** - Simula el navegador (DOM, window, localStorage) sin navegador real
- **jest-junit 16.0.0** - Reportes en formato JUnit XML para Azure DevOps

### **Reportes de Coverage**
Configurados en `jest.config.js` (backend y frontend):
- **HTML** - Reporte visual navegable
- **LCOV** - Formato estándar
- **Cobertura** - XML para Azure DevOps
- **JSON** - Datos programáticos

## 📋 Por qué estas herramientas

### **Jest**
Framework estándar de testing en JavaScript. Incluye todo lo necesario (runner, assertions, mocks, coverage) en una sola herramienta.

### **Supertest (Backend)**
Permite testear endpoints HTTP sin iniciar el servidor Express. Simula peticiones GET/POST/DELETE y verifica responses.

### **mongodb-memory-server (Backend)**
Crea una base de datos MongoDB completamente en memoria (RAM). Cada test tiene su propia BD limpia, sin afectar datos reales ni requerir conexión a CosmosDB.

### **JSDOM (Frontend)**
El frontend usa JavaScript vanilla que manipula el DOM. JSDOM simula `window`, `document`, `localStorage` y todo el navegador, permitiendo testear código cliente sin abrir un navegador real.

### **jest-junit**
Azure DevOps necesita reportes en formato JUnit XML para mostrar resultados de tests en la interfaz del pipeline. Jest genera estos archivos automáticamente.

### **Cobertura XML**
Azure DevOps usa el formato Cobertura para visualizar métricas de coverage (líneas cubiertas, ramas, funciones). Jest lo genera junto con el reporte HTML.

## 🔄 Pipeline: Por qué está así

### **Estructura actual**
```
Build → Test → DeployQA → DeployPROD
```

### **Stage: Build**
- Empaqueta backend y frontend en archivos `.zip`
- Instala solo dependencias de producción (`npm ci --production`)
- Publica artefactos para deploy

### **Stage: Test** (agregado por nosotros)
- Se ejecuta **después de Build** y **antes de Deploy**
- Instala TODAS las dependencias (`npm ci` sin --production) para tener herramientas de testing
- Ejecuta `npm test` en backend y frontend
- Publica resultados de tests (JUnit XML) y coverage (Cobertura XML)
- **Si los tests fallan → Pipeline se detiene, no hay deploy**

**Por qué después del Build:**
- Build valida que el código se pueda empaquetar
- Tests validan que el código funcione correctamente
- Solo código que pasa tests llega a QA/PROD

### **Stage: DeployQA**
- Despliega a ambiente de QA (testing)
- Solo se ejecuta si Build y Test pasan
- Solo en rama `main`

### **Stage: DeployPROD**
- Despliega a Producción
- Requiere aprobación manual (`environment: 'PROD'`)
- Solo si DeployQA fue exitoso

## ⚙️ Configuración clave

### **Backend Coverage** (`backend/jest.config.js`)
```javascript
collectCoverageFrom: [
  '**/*.js',
  '!config/**'  // Excluido: archivos de infraestructura no testeables
]
coverageThreshold: {
  global: { statements: 70, branches: 70, functions: 70, lines: 70 }
}
```

### **Frontend Coverage** (`frontend/jest.config.js`)
```javascript
testEnvironment: 'jsdom'  // Simula navegador
collectCoverageFrom: ['public/js/**/*.js']
coverageThreshold: {
  global: { statements: 40, branches: 40, functions: 40, lines: 40 }
}
```

## 📊 Resultados

| Proyecto | Tests | Coverage | Threshold |
|----------|-------|----------|-----------|
| Backend | 79 | 91.66% | ≥ 70% |
| Frontend | 114 | 94.73% | ≥ 40% |
| **TOTAL** | **193** | **~93%** | **PASS** |

## 🚨 Issue pendiente

**Problema:** Pipeline falla en Azure DevOps porque el Service Connection `Azure-Students-SC` no existe.

**Solución:** Crear el Service Connection en Azure DevOps:
1. Project settings → Service connections
2. New service connection → Azure Resource Manager
3. Nombre: `Azure-Students-SC`
4. Autorizar uso en el pipeline

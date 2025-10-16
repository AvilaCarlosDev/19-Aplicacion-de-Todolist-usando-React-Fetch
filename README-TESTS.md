# Tests del Proyecto TODO List

## Ejecutar Tests

```bash
# Instalar dependencias
pnpm install

# Ejecutar tests
pnpm test
```

## Resultado Esperado

```
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Coverage:    87.12% statements | 72.34% branches | 100% functions
```

## Corrección Realizada

**Archivo:** `src/js/components/Home.jsx` - Línea 173

**Antes:**
```javascript
const isInitialTask = taskId.startsWith("initial-");
```

**Después:**
```javascript
const isInitialTask = String(taskId).startsWith("initial-");
```

**Razón:** El método `startsWith()` solo funciona con strings. Si la API devuelve un `taskId` como número, el código fallaba. La solución convierte el ID a string antes de usar `startsWith()`.

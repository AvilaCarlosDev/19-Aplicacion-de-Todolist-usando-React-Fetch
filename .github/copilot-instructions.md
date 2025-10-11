## Objetivo rápido

Ayuda a un desarrollador/agent a ser productivo en este proyecto React + Vite que implementa un TODO list. Contiene instrucciones concretas (comandos, archivos clave y patrones) y ejemplos de integración con la API de 4Geeks Playground usada para sincronizar las tareas.

## Comandos y flujo de desarrollo

- Instalar dependencias (usa el package manager del proyecto):
  - `pnpm install` (recomendado, `package.json` declara `pnpm@10.17.1`)
  - alternativa: `npm install`
- Levantar el entorno de desarrollo:
  - `pnpm run dev` o `npm run dev` (alias `start` también apunta a `vite`)
- Construir producción: `pnpm run build`
- Previsualizar build: `pnpm run preview`
- Linter: `pnpm run lint` (ESLint configurado en package.json)

Nota: el `package.json` requiere Node >= 20.0.0 (ver campo `engines`).

## Arquitectura y archivos clave

- Entrada HTML: `index.html` en la raíz (Vite).
- Entrada JS/React: `src/js/main.jsx` (monta la app). Busca ahí para la inicialización del Router/App.
- Componentes: `src/js/components/` — el componente principal que trabajarás es `Home.jsx`.
- Estilos: `src/styles/index.css`.
- Configuración de build/deploy: `vite.config.js`, `vercel.json`.

Estructura relevante (ejemplos):
- `src/js/components/Home.jsx` — TODO list UI; actualmente contiene un array inicial de tareas en `useState`. Si vas a sincronizar con backend, reemplaza ese estado por la carga desde la API (useEffect + fetch).

## Patrones y convenciones del proyecto

- Proyecto sencillo de React con Vite, sin enrutamiento complejo.
- Usa componentes funcionales y hooks (`useState`, `useEffect`). Mantén el estilo existente (JSX + Bootstrap para clases CSS).
- Evitar cambios globales de estilo o estructura si no es necesario; añadir lógica de red dentro de `Home.jsx` es suficiente para la tarea actual.
- Linter: el proyecto está preparado para ESLint; respeta el formato del código y evita warnings.

## Integración con la API (puntos concretos)

Este proyecto debe sincronizarse con la API de playground 4Geeks. Puntos concretos para implementar:

- Crear/asegurar usuario: POST `/todo/users/{user_name}` con body (puede ser `[]` para inicializar).
- Leer tareas del usuario: GET `/todo/users/{user_name}` — usar esto en `useEffect` al montar el `Home`.
- Crear tarea: POST `/todo/todos/{user_name}` con body `{ label, done }` y, tras respuesta, volver a GET para refrescar lista.
- Eliminar tarea: DELETE `/todo/todos/{todo_id}` y luego GET para refrescar.
- Limpiar todas: patrón recomendado en este playground: DELETE `/todo/users/{user_name}` seguido de POST `/todo/users/{user_name}` con `[]` para recrearlo vacío; luego GET.

Ejemplo de llamadas fetch (resumido):

```js
// crear usuario (inicializar)
await fetch('https://playground.4geeks.com/todo/users/<user>', { method: 'POST', body: JSON.stringify([]), headers: {'Content-Type':'application/json'} });

// obtener tareas
const resp = await fetch('https://playground.4geeks.com/todo/users/<user>');
const data = await resp.json();

// crear tarea
await fetch('https://playground.4geeks.com/todo/todos/<user>', { method: 'POST', body: JSON.stringify({label:'Tarea', done:false}), headers: {'Content-Type':'application/json'} });

// borrar tarea por id
await fetch('https://playground.4geeks.com/todo/todos/<todo_id>', { method: 'DELETE' });
```

## Qué buscar/evitar al editar `Home.jsx`

- Actualmente `Home.jsx` inicializa `listTareas` con un array de strings: `['Make the bed', 'Wash my hands', ...]`. Para integrarlo con la API:
  - remplazar ese estado por un array de objetos normalizados del servidor: `{ id, label, done }`.
  - usar `useEffect` para crear/asegurar usuario y luego llamar a GET para cargar tareas.
  - después de POST/DELETE siempre llamar a GET para mantener sincronía.
  - para "Clear all" elimina y recrea el usuario como se indica arriba.

## Dependencias e integración externa

- Dependencias primarias: `react`, `react-dom`, `vite`, `bootstrap`.
- No hay tests ni CI en el repo por defecto. No asumas la existencia de herramientas de test.
- Deploy: hay `vercel.json` si necesitas comprobar cómo se configura el despliegue en Vercel.

## Ejemplos de cambios esperados (pequeños y no invasivos)

- Añadir `useEffect` en `Home.jsx` que llame a `ensureUser()` y `fetchTodos()`.
- Convertir `listTareas` a estado con objetos; actualizar la renderización para mostrar `tarea.label`.
- Añadir botón "Clear all" en el `card-footer` que ejecute el patrón DELETE/POST.

## Preguntas abiertas para el desarrollador

- ¿Qué `user_name` usar en la API? En ejemplos usamos `alesanchezr` pero el agente debe preguntarlo si no está confirmado.
- ¿Deseas mantener las tareas iniciales locales además de sincronizarlas al servidor? (actualmente están hardcodeadas en `Home.jsx`).

Si quieres, aplico el cambio automático en `src/js/components/Home.jsx` para convertir las tareas iniciales a objetos y añadir la integración Fetch descrita.

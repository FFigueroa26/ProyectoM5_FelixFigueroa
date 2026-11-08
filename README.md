# 🔧 GitHub MCP Server

> Servidor MCP (Model Context Protocol) que permite a modelos de lenguaje (LLMs) interactuar con la API de GitHub de forma segura, validada y con manejo robusto de errores.

---

## 📑 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Casos de Uso](#-casos-de-uso)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Paso a Paso](#-instalación-paso-a-paso)
- [Configuración del Token de GitHub](#-configuración-del-token-de-github)
- [Configuración en Antigravity](#-configuración-en-antigravity)
- [Tools Disponibles](#-tools-disponibles)
  - [create_repository](#1-create_repository---crear-repositorio)
  - [list_repositories](#2-list_repositories---listar-repositorios)
  - [create_issue](#3-create_issue---crear-issue)
  - [list_issues](#4-list_issues---listar-issues)
  - [create_commit](#5-create_commit---crear-commit)
- [Ejemplos de Uso Integrados](#-ejemplos-de-uso-integrados)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tests](#-tests)
- [Seguridad](#-seguridad)
- [Troubleshooting](#-troubleshooting)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Autor](#-autor)
- [Licencia](#-licencia)

---

## 📖 Descripción del Proyecto

Este proyecto implementa un **servidor MCP** que expone operaciones de GitHub como _tools_ que pueden ser invocadas por un LLM (como Claude, Gemini, etc.) a través del protocolo MCP.

El servidor actúa como un **puente inteligente** entre el modelo de lenguaje y la API de GitHub, proporcionando:

- **Validación estricta** de entradas con Zod antes de llamar a la API.
- **Mensajes de error en lenguaje natural** diseñados para que el LLM los comunique al usuario.
- **Reintentos automáticos** con backoff exponencial ante errores transitorios.
- **Logging seguro** que redacta tokens y datos sensibles.

---

## 💡 Casos de Uso

### ¿Por qué es útil?

Este MCP Server resuelve el problema de tener que alternar entre el editor de código y el navegador para realizar operaciones comunes en GitHub. Con él, puedes hacer todo **directamente desde una conversación con tu agente de IA**.

### Escenarios prácticos

| Escenario | Sin MCP Server | Con MCP Server |
|---|---|---|
| Crear un repositorio | Abrir GitHub → New repo → Llenar formulario → Create | _"Crea un repositorio llamado mi-api"_ |
| Ver tus repositorios | Abrir GitHub → Navegar tu perfil → Buscar | _"¿Qué repositorios tengo?"_ |
| Reportar un bug | Abrir GitHub → Ir al repo → Issues → New issue | _"Abre un issue en mi-api: el endpoint /users falla"_ |
| Revisar issues pendientes | Abrir GitHub → Ir al repo → Issues → Filtrar | _"¿Qué issues abiertos tiene mi-api?"_ |
| Crear o actualizar un archivo | Abrir GitHub → Navigate → Edit → Commit | _"Agrega un README.md a mi-api con una descripción básica"_ |

### ¿Para quién es?

- **Desarrolladores** que trabajan con agentes de IA (Antigravity, Claude Desktop, etc.) y quieren automatizar tareas de GitHub sin salir de su flujo de trabajo.
- **Equipos** que quieren que su agente de IA gestione repositorios, issues y archivos directamente.
- **Estudiantes** aprendiendo sobre el protocolo MCP y cómo integrar APIs externas con LLMs.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** versión 18.0.0 o superior → [Descargar Node.js](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Git** → [Descargar Git](https://git-scm.com/)
- Una cuenta de **GitHub** con un [Personal Access Token](#-configuración-del-token-de-github)

Verifica tus versiones:

```bash
node --version   # Debe ser >= 18.0.0
npm --version    # Debe ser >= 8.0.0
git --version
```

---

## 🚀 Instalación Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/FFigueroa26/ProyectoM5_FelixFigueroa.git
cd ProyectoM5_FelixFigueroa
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el token de GitHub

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tu token:

```env
GITHUB_TOKEN=ghp_tu_token_aqui
```

> ⚠️ **Importante:** El archivo `.env` está en el `.gitignore` y **nunca** se sube al repositorio.

### 4. Compilar el proyecto

```bash
npm run build
```

### 5. Verificar que todo funciona

```bash
npm test
```

Deberías ver algo como:

```
 ✓ src/tests/errors.test.ts (6)
 ✓ src/tests/schemas.test.ts (10)
 ✓ src/tests/github.test.ts (8)

 Test Files  3 passed (3)
      Tests  24 passed (24)
```

### 6. Verificar que el servidor arranca correctamente

```bash
npm run dev
```

Si la configuración es correcta, verás este mensaje en la terminal:

```
[github-mcp-server] v0.1.0 iniciado. Comunicación por stdio.
```

Esto confirma que el token es válido y el servidor está listo para recibir conexiones MCP. Presiona `Ctrl + C` para detenerlo.

---

## 🔑 Configuración del Token de GitHub

### ¿Qué es un Personal Access Token (PAT)?

Un PAT es una alternativa segura a las contraseñas para autenticarte con la API de GitHub. Tu MCP Server lo usa para crear repositorios, issues y commits en tu nombre.

### Pasos para generar tu token

1. **Inicia sesión** en [github.com](https://github.com)

2. Ve a **Settings** (Configuración):
   - Haz clic en tu foto de perfil (esquina superior derecha)
   - Selecciona **"Settings"**

3. En el menú lateral izquierdo, baja hasta **"Developer settings"**

4. Selecciona **"Personal access tokens" → "Tokens (classic)"**

5. Haz clic en **"Generate new token" → "Generate new token (classic)"**

6. Configura el token:
   - **Note:** `MCP Server - GitHub` (o el nombre que prefieras)
   - **Expiration:** Selecciona una fecha (se recomienda 90 días)
   - **Scopes (permisos):** Marca los siguientes:

   | Scope | Descripción | ¿Para qué se usa? |
   |---|---|---|
   | ✅ `repo` | Control total de repositorios privados | Crear repos, commits, leer contenido |
   | ✅ `user` | Leer información del perfil | Listar repositorios del usuario |
   | ✅ `admin:org` _(opcional)_ | Gestión de organizaciones | Solo si trabajas con repos de organizaciones |

7. Haz clic en **"Generate token"**

8. **¡Copia el token inmediatamente!** GitHub no lo mostrará de nuevo.

9. Pega el token en tu archivo `.env`:

```env
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Verificar que el token funciona

Puedes probar tu token con este comando:

```bash
curl -H "Authorization: Bearer ghp_tu_token_aqui" https://api.github.com/user
```

Si ves tu información de perfil en formato JSON, ¡el token es válido! ✅

---

## ⚙️ Configuración en Antigravity

Antigravity puede conectarse a este servidor MCP para permitirle al asistente interactuar directamente con tu cuenta de GitHub. Dado que el `GITHUB_TOKEN` ya quedó configurado de forma segura en tu archivo `.env` en los pasos anteriores, el servidor lo cargará automáticamente siempre que el `cwd` apunte a la carpeta del proyecto.

### Paso 1: Ubicar o abrir el archivo de configuración MCP

Puedes registrar el servidor de dos formas según tu preferencia:

- **Opción A: Por espacio de trabajo (Recomendado para este proyecto)**  
  Crea o edita el archivo de configuración en la carpeta `.agents` dentro de la raíz de tu proyecto:
  ```text
  .agents/mcp_config.json
  ```

- **Opción B: A nivel global de Antigravity**  
  Edita el archivo global de configuración de Antigravity en tu usuario:
  - **Windows:** `%USERPROFILE%\.gemini\antigravity-ide\mcp_config.json` (ej. `C:\Users\<tu-usuario>\.gemini\antigravity-ide\mcp_config.json`)
  - **macOS / Linux:** `~/.gemini/antigravity-ide/mcp_config.json`
  *(O directamente desde la interfaz de Antigravity: **Settings / Configuración → MCP Servers**)*

### Paso 2: Agregar el servidor

Agrega el siguiente bloque dentro de `mcpServers`. Asegúrate de colocar la ruta absoluta real donde clonaste el proyecto en `cwd`:

```json
{
  "mcpServers": {
    "github-automatehub": {
      "command": "node",
      "args": ["dist/server.js"],
      "cwd": "c:/Users/tu_usuario/Desktop/ProyectoM5_FelixFigueroa"
    }
  }
}
```

> 🔒 **¿Por qué no es necesario poner el token aquí?**  
> Gracias a que el servidor usa `dotenv`, al iniciar tomará las variables de entorno de tu archivo `.env` local ubicado en `cwd`. Esto evita duplicar información y protege tu token impidiendo que quede expuesto en texto plano en la configuración del cliente.

> 💡 **Nota sobre rutas en Windows:**  
> Puedes usar barras diagonales (`/`) como en el ejemplo, o dobles barras invertidas (`\\`):  
> `"cwd": "C:\\Users\\tu_usuario\\Desktop\\ProyectoM5_FelixFigueroa"`

### Paso 3: Reiniciar o recargar Antigravity

Una vez guardado el archivo `mcp_config.json`:
1. Reinicia Antigravity o recarga la ventana/sesión para que registre el nuevo servidor.
2. Al iniciar, Antigravity levantará el proceso en segundo plano vía `stdio`.

### Paso 4: ¿Cómo verificar que quedó bien configurado?

1. **Revisa las tools disponibles:** En la interfaz de Antigravity o en la lista de herramientas del chat, confirma que aparezcan las 5 tools del servidor:
   - `create_repository`
   - `create_issue`
   - `list_repositories`
   - `create_commit`
   - `list_issues`
2. **Haz una prueba interactiva:** Envía un mensaje sencillo al asistente:
   > *"Por favor lista mis primeros 3 repositorios de GitHub."*
3. Si el asistente te responde con la lista real de tus repositorios, ¡el servidor MCP está correctamente configurado y listo para usarse! 🚀

---

### Scripts de ejecución del servidor

Para referencia durante el desarrollo o uso manual:

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia en desarrollo con recarga automática (`tsx watch`) |
| `npm run build` | Compila TypeScript a JavaScript en la carpeta `dist/` |
| `npm start` | Inicia el servidor compilado en producción (`node dist/server.js`) |


---

## 🛠 Tools Disponibles

### 1. `create_repository` — Crear repositorio

Crea un nuevo repositorio en GitHub para el usuario autenticado.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | `string` | ✅ | Nombre del repositorio (3-100 caracteres, solo letras, números y guiones) |
| `description` | `string` | ❌ | Descripción breve (máximo 350 caracteres) |
| `private` | `boolean` | ❌ | Si es `true`, el repo es privado. Por defecto: `false` |

#### Ejemplos de prompts efectivos

```
✅ "Crea un repositorio público llamado mi-proyecto-web con la descripción
    'Landing page con React y TypeScript'"

✅ "Necesito un repo privado que se llame api-backend"

✅ "Crea un repositorio llamado docs-equipo, que sea privado y con descripción
    'Documentación interna del equipo de desarrollo'"
```

#### Ejemplo de respuesta

```
Repositorio creado: FFigueroa26/mi-proyecto-web
Visibilidad: público
Rama por defecto: main
URL: https://github.com/FFigueroa26/mi-proyecto-web
```

---

### 2. `list_repositories` — Listar repositorios

Lista los repositorios del usuario autenticado en GitHub.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `visibility` | `"all" \| "public" \| "private"` | ❌ | Filtro de visibilidad. Por defecto: `"all"` |
| `perPage` | `number` | ❌ | Cantidad de resultados (1-100). Por defecto: `30` |

#### Ejemplos de prompts efectivos

```
✅ "¿Qué repositorios tengo en GitHub?"

✅ "Muéstrame mis repositorios privados"

✅ "Lista mis últimos 5 repositorios públicos"
```

#### Ejemplo de respuesta

```
Repositorios encontrados (3):
- FFigueroa26/mi-proyecto (público): Landing page con React - https://github.com/FFigueroa26/mi-proyecto
- FFigueroa26/api-backend (privado): API REST con Express - https://github.com/FFigueroa26/api-backend
- FFigueroa26/docs (público): sin descripción - https://github.com/FFigueroa26/docs
```

---

### 3. `create_issue` — Crear issue

Abre un issue nuevo en un repositorio existente.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ | Dueño del repositorio (usuario u organización) |
| `repo` | `string` | ✅ | Nombre del repositorio |
| `title` | `string` | ✅ | Título del issue (1-256 caracteres) |
| `body` | `string` | ❌ | Descripción detallada en Markdown |

#### Ejemplos de prompts efectivos

```
✅ "Crea un issue en mi repo mi-proyecto que diga 'El botón de login no responde
    en móviles'"

✅ "Abre un bug en FFigueroa26/api-backend con título 'Error 500 en endpoint
    /users' y en el body explica que ocurre al enviar un POST sin body"

✅ "Registra una tarea en mi-proyecto: 'Agregar tests de integración para el
    módulo de pagos'"
```

#### Ejemplo de respuesta

```
Issue #7 creado en FFigueroa26/mi-proyecto: "El botón de login no responde en móviles"
Estado: open
Autor: FFigueroa26
URL: https://github.com/FFigueroa26/mi-proyecto/issues/7
```

---

### 4. `list_issues` — Listar issues

Lista los issues de un repositorio existente, filtrando por estado.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ | Dueño del repositorio |
| `repo` | `string` | ✅ | Nombre del repositorio |
| `state` | `"open" \| "closed" \| "all"` | ❌ | Estado de los issues. Por defecto: `"open"` |
| `perPage` | `number` | ❌ | Cantidad de resultados (1-100). Por defecto: `30` |

#### Ejemplos de prompts efectivos

```
✅ "¿Qué issues abiertos tiene mi repositorio mi-proyecto?"

✅ "Muéstrame los issues cerrados de FFigueroa26/api-backend"

✅ "Lista todos los issues (abiertos y cerrados) de mi-proyecto, solo los
    últimos 10"
```

#### Ejemplo de respuesta

```
Issues encontrados (2):
- #7 [open] El botón de login no responde en móviles (por FFigueroa26) - https://github.com/FFigueroa26/mi-proyecto/issues/7
- #3 [open] Agregar dark mode (por FFigueroa26) - https://github.com/FFigueroa26/mi-proyecto/issues/3
```

---

### 5. `create_commit` — Crear commit

Crea o modifica un archivo en un repositorio mediante un commit.

#### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `owner` | `string` | ✅ | Dueño del repositorio |
| `repo` | `string` | ✅ | Nombre del repositorio |
| `path` | `string` | ✅ | Ruta relativa del archivo (ej: `src/index.ts`) |
| `content` | `string` | ✅ | Contenido completo del archivo |
| `message` | `string` | ✅ | Mensaje del commit |
| `branch` | `string` | ❌ | Rama destino. Por defecto: rama principal del repo |

#### Ejemplos de prompts efectivos

```
✅ "Crea un archivo README.md en mi-proyecto con un título y descripción básica,
    usa el mensaje de commit 'docs: agrega README inicial'"

✅ "Agrega un archivo src/config.ts en mi repo api-backend con la configuración
    de la base de datos"

✅ "Actualiza el archivo docs/guia.md en mi-proyecto en la rama develop con el
    nuevo contenido que te paso"
```

#### Ejemplo de respuesta

```
Commit abc1234 creado en FFigueroa26/mi-proyecto (rama main): "docs: agrega README inicial"
Archivo: README.md
URL: https://github.com/FFigueroa26/mi-proyecto/commit/abc1234def
```

> ⚠️ **Nota:** Si el archivo ya existe, el servidor obtiene su SHA automáticamente para actualizarlo. No necesitas preocuparte por conflictos.

---

## 🎯 Ejemplos de Uso Integrados

A continuación, un flujo completo que demuestra las 5 tools trabajando juntas en una conversación con el agente:

```
👤 Usuario: "Crea un repositorio público llamado mi-app-web con descripción
            'Aplicación web fullstack'"
🤖 Agente:  → Ejecuta create_repository
            ✅ Repositorio creado: FFigueroa26/mi-app-web

👤 Usuario: "Ahora agrega un README.md con el nombre del proyecto y una
            descripción básica"
🤖 Agente:  → Ejecuta create_commit
            ✅ Commit abc1234 creado, archivo: README.md

👤 Usuario: "Abre un issue para recordarme agregar autenticación"
🤖 Agente:  → Ejecuta create_issue
            ✅ Issue #1 creado: "Implementar autenticación de usuarios"

👤 Usuario: "¿Qué issues tiene mi-app-web?"
🤖 Agente:  → Ejecuta list_issues
            ✅ Issues encontrados (1):
               - #1 [open] Implementar autenticación de usuarios

👤 Usuario: "Muéstrame todos mis repositorios"
🤖 Agente:  → Ejecuta list_repositories
            ✅ Repositorios encontrados (4):
               - FFigueroa26/mi-app-web (público)
               - FFigueroa26/api-backend (privado)
               - ...
```

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE COMUNICACIÓN                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     Prompt      ┌──────────────┐    Tool Call     ┌──────────────┐    REST API    ┌──────────────┐
│              │ ──────────────► │              │ ───────────────► │              │ ─────────────► │              │
│  Antigravity │                 │     LLM      │                  │  MCP Server  │                │  GitHub API  │
│    (Host)    │                 │   (Client)   │                  │  (este repo) │                │  (REST v3)   │
│              │ ◄────────────── │              │ ◄─────────────── │              │ ◄───────────── │              │
└──────────────┘    Respuesta    └──────────────┘   Tool Result    └──────────────┘   JSON Response└──────────────┘
                    en lenguaje                                     │
                    natural                                         │  Internamente:
                                                                    │
                                                                    ├── 📋 Schemas (Zod)    → Valida entradas
                                                                    ├── 🔄 Retry            → Reintenta errores transitorios
                                                                    ├── 🛡️ Errors           → Traduce errores a lenguaje natural
                                                                    └── 📝 Logger           → Registra sin exponer tokens
```

### Flujo detallado de una operación

```
1. El usuario escribe un prompt en Antigravity (Host)
2. Antigravity envía el prompt al LLM (Client)
3. El LLM interpreta la intención y decide invocar una tool del MCP Server
4. El MCP Server:
   a. Valida los parámetros con Zod
   b. Llama a la API de GitHub vía Octokit
   c. Si hay error transitorio, reintenta con backoff exponencial
   d. Mapea la respuesta a un formato limpio (o traduce el error a lenguaje natural)
5. El resultado viaja de vuelta: MCP Server → LLM → Antigravity → Usuario
```

---

## 📂 Estructura del Proyecto

```
ProyectoM5_FelixFigueroa/
├── src/
│   ├── server.ts              # Punto de entrada: crea el servidor MCP y registra tools
│   ├── types.ts               # Interfaces TypeScript (RepositorySummary, IssueSummary, etc.)
│   ├── schemas/
│   │   └── index.ts           # Schemas de validación Zod para cada tool
│   ├── tools/
│   │   ├── create-repository.ts   # Tool: crear repositorio
│   │   ├── create-issue.ts        # Tool: crear issue
│   │   ├── create-commit.ts       # Tool: crear commit
│   │   ├── list-repositories.ts   # Tool: listar repositorios
│   │   └── list-issues.ts         # Tool: listar issues
│   ├── github/
│   │   ├── client.ts          # Cliente Octokit, mapeo de errores HTTP
│   │   └── operations.ts      # Operaciones de negocio (create, list, etc.)
│   ├── errors/
│   │   └── index.ts           # Clases de error custom + formatErrorForLLM()
│   ├── utils/
│   │   ├── logging.ts         # Logger con redacción automática de tokens
│   │   └── retry.ts           # Retry con backoff exponencial
│   └── tests/
│       ├── schemas.test.ts    # Tests de validación de schemas (10 tests)
│       ├── errors.test.ts     # Tests de formateo de errores (6 tests)
│       └── github.test.ts     # Tests de operaciones con mocks (8 tests)
├── .env.example               # Plantilla de variables de entorno
├── .gitignore                 # Archivos excluidos del repositorio
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración de TypeScript
└── vitest.config.ts           # Configuración de Vitest
```

---

## 🧪 Tests

El proyecto incluye **24 tests unitarios** organizados en 3 archivos:

| Archivo | Tests | Qué valida |
|---|---|---|
| `schemas.test.ts` | 10 | Validación de nombres, owners, rutas, parámetros opcionales |
| `errors.test.ts` | 6 | Formateo de errores 404, 401, rate limit, validación, red y desconocidos |
| `github.test.ts` | 8 | Operaciones con mocks: crear repo, issues, commits, listar, filtrar PRs |

### Ejecutar tests

```bash
# Ejecutar todos los tests una vez
npm test

# Ejecutar en modo watch (re-ejecuta al guardar cambios)
npm run test:watch
```

---

## 🔒 Seguridad

Este servidor implementa múltiples capas de seguridad:

- **Redacción de tokens en logs**: Cualquier token (`ghp_*`, `github_pat_*`) que aparezca en los logs es reemplazado automáticamente por `[REDACTED]`.
- **Validación de rutas**: Los schemas rechazan rutas absolutas (`/etc/passwd`) y path traversal (`../secreto.txt`).
- **Schemas estrictos**: Zod con `.strict()` rechaza campos desconocidos, previniendo inyección de parámetros.
- **`.env` en `.gitignore`**: El token nunca se sube al repositorio.
- **Errores sin stack traces**: `formatErrorForLLM()` devuelve mensajes limpios sin exponer detalles técnicos.

---

## ❓ Troubleshooting

### El servidor no arranca

**Error:** `Falta configurar GITHUB_TOKEN`

```
Solución:
1. Verifica que el archivo .env existe en la raíz del proyecto
2. Verifica que contiene GITHUB_TOKEN=ghp_tu_token
3. Asegúrate de que no hay espacios alrededor del "="
```

### Error de autenticación (401)

**Error:** `No se pudo autenticar con GitHub`

```
Solución:
1. Tu token puede haber expirado → genera uno nuevo en GitHub Settings
2. Verifica que copiaste el token completo (empieza con ghp_ o github_pat_)
3. Actualiza el archivo .env con el nuevo token
```

### Rate limiting (429)

**Error:** `GitHub limitó temporalmente las solicitudes`

```
Solución:
1. Espera el tiempo indicado en el mensaje (el servidor reintenta automáticamente)
2. Los tokens autenticados tienen un límite de 5,000 solicitudes/hora
3. Si llegas al límite frecuentemente, espacía las operaciones
```

### El repositorio no fue encontrado (404)

**Error:** `El repositorio owner/repo no fue encontrado`

```
Solución:
1. Verifica que el nombre del owner y repo estén correctamente escritos
2. Si el repositorio es privado, asegúrate de que tu token tiene el scope "repo"
3. Verifica que el repositorio existe en GitHub
```

### Error al compilar TypeScript

**Error:** `tsc: command not found` o errores de compilación

```
Solución:
1. Ejecuta npm install para instalar las dependencias
2. Asegúrate de usar Node.js >= 18.0.0
3. Si persiste, elimina node_modules y package-lock.json, luego ejecuta npm install de nuevo
```

### Los tests fallan

```
Solución:
1. Ejecuta npm install para asegurar que las dependencias están instaladas
2. Los tests usan mocks y NO requieren un token real de GitHub
3. Si un test falla, verifica que no hayas modificado los archivos en src/errors/,
   src/schemas/ o src/github/ sin actualizar los tests
```

### Antigravity no detecta las tools del servidor

```
Solución:
1. Asegúrate de haber compilado el proyecto ejecutando npm run build para que exista el archivo dist/server.js
2. Verifica que la ruta "cwd" en mcp_config.json sea la ruta absoluta exacta a la carpeta del proyecto
3. Asegúrate de haber guardado mcp_config.json y haber reiniciado o recargado la ventana de Antigravity
4. Comprueba que el archivo .env exista en la raíz del proyecto con GITHUB_TOKEN configurado
```

---

## 🧰 Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.0.0 | Runtime de JavaScript |
| [TypeScript](https://www.typescriptlang.org/) | 5.6 | Tipado estático |
| [MCP SDK](https://modelcontextprotocol.io/) | 1.17 | Protocolo de comunicación con LLMs |
| [Octokit](https://github.com/octokit/rest.js) | 21.0 | Cliente oficial de la API de GitHub |
| [Zod](https://zod.dev/) | 3.23 | Validación y parsing de schemas |
| [Vitest](https://vitest.dev/) | 2.1 | Framework de testing |
| [dotenv](https://www.npmjs.com/package/dotenv) | 18.0 | Carga de variables de entorno |
| [tsx](https://tsx.is/) | 4.19 | Ejecución directa de TypeScript |

---

## 👤 Autor

**Félix Figueroa** — [@FFigueroa26](https://github.com/FFigueroa26)

---

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License**.

```
MIT License

Copyright (c) 2026 Félix Figueroa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

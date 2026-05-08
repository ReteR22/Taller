# MechPro — Guía de Instalación para VS Code

## ⚡ Requisitos previos

| Herramienta | Versión mínima | Verificar |
|-------------|----------------|-----------|
| Node.js     | 18+            | `node -v` |
| npm         | 9+             | `npm -v`  |
| MySQL       | 8.0            | `mysql --version` |
| Git         | cualquiera     | `git --version` |

---

## 🚀 Pasos de instalación (en orden)

### 1. Abrí el proyecto en VS Code

```bash
# Cloná o descomprimí el proyecto, luego:
code mechpro/mechpro.code-workspace
```

> VS Code va a sugerir instalar las extensiones recomendadas. **Aceptá todas.**

---

### 2. Configurá MySQL

Abrí MySQL y creá la base de datos:

```sql
CREATE DATABASE mechpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mechpro'@'localhost' IDENTIFIED BY 'mechpro123';
GRANT ALL PRIVILEGES ON mechpro.* TO 'mechpro'@'localhost';
FLUSH PRIVILEGES;
```

---

### 3. Configurá las variables de entorno

El archivo `apps/api/.env` ya viene preconfigurado para desarrollo local.
**Solo necesitás cambiar:**

```env
# apps/api/.env
DATABASE_URL="mysql://mechpro:mechpro123@localhost:3306/mechpro"
ANTHROPIC_API_KEY="sk-ant-api03-TU-KEY-AQUI"   # ← Esto es lo único que necesitás cambiar
```

> Obtenés tu API Key en: https://console.anthropic.com

---

### 4. Instalá dependencias

En la terminal integrada de VS Code (`Ctrl + `` ` ``):

```bash
npm install
```

---

### 5. Generá el cliente Prisma y migrá la BD

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

---

### 6. Cargá datos de ejemplo (seed)

```bash
npx tsx prisma/seed.ts
```

Salida esperada:
```
✅ Usuarios creados
✅ Clientes creados
✅ Vehículos creados
✅ Repuestos creados
✅ Orden de trabajo creada
✅ Tags creados
═══════════════════════════════════════════
  🚀 Seed completado! Datos de acceso:
  Admin:    admin@mechpro.com / admin123
  Mecánico: mecanico@mechpro.com / mecanico123
═══════════════════════════════════════════
```

---

### 7. Ejecutá el proyecto

**Opción A — Desde VS Code Tasks (recomendado):**
- `Ctrl + Shift + P` → "Tasks: Run Task" → "🔥 Dev: Full Stack"

**Opción B — Desde terminal:**
```bash
# Desde la raíz del proyecto
npm run dev
```

**Opción C — Por separado:**
```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — Web
npm run dev:web
```

---

### 8. Abrí en el browser

| Servicio       | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:5173             |
| API            | http://localhost:3001             |
| Health check   | http://localhost:3001/health      |
| Prisma Studio  | `npm run db:studio` → :5555      |

---

## 🔑 Credenciales de acceso

```
Admin:    admin@mechpro.com     / admin123
Mecánico: mecanico@mechpro.com  / mecanico123
```

---

## 🛠️ Comandos útiles

```bash
# Reset completo de la base de datos
npm run db:reset

# Abrir Prisma Studio (visualizador de BD)
npm run db:studio

# Ver logs en tiempo real (API)
tail -f apps/api/logs/combined.log

# Generar cliente Prisma tras cambiar schema
cd apps/api && npx prisma generate

# Crear nueva migración
cd apps/api && npx prisma migrate dev --name nombre_migracion
```

---

## 📁 Estructura del proyecto

```
mechpro/
├── apps/
│   ├── api/                   ← Backend Node.js + Express
│   │   ├── src/
│   │   │   ├── routes/        ← Endpoints REST
│   │   │   ├── middlewares/   ← Auth JWT, errores, etc.
│   │   │   ├── config/        ← DB, JWT config
│   │   │   └── utils/         ← Logger, helpers
│   │   ├── prisma/
│   │   │   ├── schema.prisma  ← Modelos de base de datos
│   │   │   └── seed.ts        ← Datos de ejemplo
│   │   └── .env               ← Variables de entorno (editá aquí)
│   │
│   └── web/                   ← Frontend React + Vite
│       └── src/
│           ├── pages/         ← Vistas (Dashboard, AI, etc.)
│           ├── components/    ← Componentes reutilizables
│           ├── store/         ← Estado global (Zustand)
│           └── services/      ← API client (Axios)
│
├── mechpro.code-workspace     ← Abrí ESTE archivo en VS Code
└── package.json               ← Scripts de monorepo
```

---

## ❓ Problemas comunes

**Error: Cannot connect to MySQL**
```
# Verificá que MySQL esté corriendo:
sudo service mysql start   # Linux
brew services start mysql  # Mac
# En Windows: busca "MySQL" en Services
```

**Error: Prisma Client not generated**
```bash
cd apps/api && npx prisma generate
```

**Error: Port 3001 already in use**
```bash
# Cambiá el puerto en apps/api/.env:
PORT=3002
# Y actualizá apps/web/vite.config.ts con el nuevo puerto
```

**Error: ANTHROPIC_API_KEY invalid**
```
# Asegurate de poner tu key real en apps/api/.env
# La key empieza con: sk-ant-api03-...
```

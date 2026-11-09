# Web Admin — Constructora C&J

Panel de administración (Next.js) del sistema de control de inventario de obra.
Implementa el login con **MySQL local + bcrypt + cookie JWT**, siguiendo Clean
Architecture (ver `../spec/login-web-admin-01-11-2026/`).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (`strict`)
- Tailwind CSS 4
- MySQL 8 (`mysql2`), contraseñas con `bcryptjs`, sesión JWT con `jose`
- ESLint + Prettier

## Requisitos

- Node.js 20.9+
- MySQL 8 corriendo localmente

## Configuración

1. Copia el ejemplo de variables de entorno y complétalo:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=cj_app
   MYSQL_PASSWORD=...
   MYSQL_DATABASE=constructora_cj
   AUTH_JWT_SECRET=<cadena-larga-aleatoria>
   ```

   `.env.local` está en `.gitignore` y no debe commitearse.

2. Crea la base de datos y el esquema:

   ```bash
   mysql -u root -p < db/0001_init.sql
   ```

3. Crea un usuario de aplicación (no-root) y dale permisos:

   ```sql
   CREATE USER 'cj_app'@'localhost' IDENTIFIED BY 'tu-password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON constructora_cj.* TO 'cj_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. Crea un usuario de prueba (contraseña con hash bcrypt). Ejemplo en Node:

   ```bash
   node -e "const m=require('mysql2/promise'),b=require('bcryptjs');(async()=>{const c=await m.createConnection({host:'localhost',user:'root',password:'ROOT_PW',database:'constructora_cj'});await c.execute('INSERT INTO users (email,password_hash,full_name,role) VALUES (?,?,?,?)',['anfereza@gmail.com',b.hashSync('password',10),'Andrés Felipe Rengifo','manager']);await c.end();})();"
   ```

## Scripts

```bash
npm run dev           # servidor de desarrollo
npm run build         # build de producción
npm run lint          # ESLint
npm run format        # Prettier (escribe)
npm run format:check  # Prettier (verifica)
```

## Arquitectura (Clean Architecture)

```
src/
  core/            # result type, DI (server)
  lib/             # pool MySQL (mysql.ts), sesión JWT (session.ts)
  features/auth/
    domain/        # entidades, interfaz de repositorio, casos de uso (sin framework)
    data/          # datasource MySQL + implementación de repositorio (bcrypt)
    presentation/  # form, container, server actions, hook, strings (ES), RBAC
  app/             # rutas (login, grupo protegido (admin), dashboard)
db/
  0001_init.sql    # esquema MySQL (tabla users)
```

- `domain/` no importa React ni MySQL.
- Solo `data/datasources/mysql-auth.datasource.ts` consulta MySQL; `lib/session.ts`
  maneja la cookie JWT.
- Código en inglés; textos de usuario en español centralizados en
  `features/auth/presentation/strings/auth-strings.ts`.

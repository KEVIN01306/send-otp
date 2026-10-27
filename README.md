# 🚀 Microservicio de Autenticación, Códigos OTP y Envíos de Correo

Microservicio centralizado diseñado bajo **Clean Architecture (Hexagonal)** para gestionar la generación y verificación de códigos OTP de alta seguridad, envío de correos transaccionales y de verificación, y autenticación multi-proyecto mediante **API Keys** criptográficas.

---

## 📑 Tabla de Contenidos
1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación del Proyecto](#-instalación-del-proyecto)
3. [Configuración de Variables de Entorno (.env)](#-configuración-de-variables-de-entorno-env)
   - [Paso a paso: de .env.example a .env](#paso-a-paso-de-envexample-a-env)
   - [Descripción detallada de cada variable](#descripción-detallada-de-cada-variable)
4. [Cómo Obtener la API Key de Resend](#-cómo-obtener-la-api-key-de-resend)
5. [Base de Datos con Prisma (Comandos y Configuración)](#-base-de-datos-con-prisma-comandos-y-configuración)
6. [Contraseña Master (Master Key) y API Keys para Otros Proyectos](#-contraseña-master-master-key-y-api-keys-para-otros-proyectos)
   - [¿Para qué sirve la Contraseña Master?](#para-qué-sirve-la-contraseña-master)
   - [Cómo generar API Keys para tus otros proyectos](#cómo-generar-api-keys-para-tus-otros-proyectos)
7. [Cómo Cambiar el Logo en las Plantillas de Correo](#-cómo-cambiar-el-logo-en-las-plantillas-de-correo)
8. [Documentación de Endpoints](#-documentación-de-endpoints)
   - [Health Check](#health-check)
   - [Módulo OTP](#módulo-otp)
   - [Módulo Email](#módulo-email)
   - [Módulo Administración (Admin)](#módulo-administración-admin)
9. [Comandos para Levantar el Servidor y Pruebas](#-comandos-para-levantar-el-servidor-y-pruebas)

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:
- **Node.js**: Versión 18.x o superior (recomendado 20.x o superior).
- **npm**: Gestor de paquetes incluido con Node.
- **MySQL**: Versión 8.0 o compatible (o MariaDB).
- Una cuenta en [Resend](https://resend.com) para el envío de correos.

---

## 💻 Instalación del Proyecto

1. Abre tu terminal y ubícate en la carpeta `backend` del microservicio:
   ```bash
   cd backend
   ```

2. Instala todas las dependencias del proyecto:
   ```bash
   npm install
   ```

---

## ⚙️ Configuración de Variables de Entorno (.env)

El archivo `.env.example` contiene la plantilla de todas las variables necesarias para que el microservicio funcione correctamente. **El microservicio no funcionará sin un archivo `.env` configurado.**

### Paso a paso: de `.env.example` a `.env`

1. En la raíz de la carpeta `backend`, duplica el archivo `.env.example` y nómbralo `.env`:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` recién creado en tu editor de código y completa los valores correspondientes.

### Descripción detallada de cada variable

| Variable | ¿Para qué sirve? | ¿Cómo conseguirla o generarla? | Ejemplo |
| :--- | :--- | :--- | :--- |
| `PORT` | Puerto de red en el que escuchará el servidor Express. | Elige cualquier puerto disponible en tu servidor o máquina local. | `8000` |
| `DATABASE_URL` | Cadena de conexión JDBC/MySQL hacia tu base de datos para Prisma. | Formato: `mysql://<USUARIO>:<PASSWORD>@<HOST>:<PUERTO>/<NOMBRE_BD>`. Debes crear la base de datos en MySQL antes de conectar. | `"mysql://root:admin123@localhost:3306/otp_microservice_db"` |
| `FRONTEND_URL` | URL del frontend cliente permitido por CORS y redirecciones. | La URL base de tu frontend en desarrollo o producción. | `http://localhost:8001` |
| `JWT_SECRET` | Secreto criptográfico de alta entropía utilizado para firmar tokens. | Puedes generar una cadena segura ejecutando en tu terminal: `openssl rand -base64 32` | `"3+(n88v4O\`V%vhFEw31j8M9{~uQbK4;("` |
| `JWT_ISS` | Identificador del emisor (Issuer) del token JWT. | Tu dominio o el identificador del microservicio. | `"https://otp.send.com"` |
| `JWT_AUD` | Audiencia (Audience) autorizada a consumir el token JWT. | El dominio de los clientes que consumirán el token. | `"https://otp.send.com"` |
| `JWT_ACCESS_TTL` | Tiempo de vida del Access Token. | Intervalo de tiempo recomendado de corta duración (ej. 15 minutos). | `"15m"` |
| `JWT_REFRESH_TTL` | Tiempo de vida del Refresh Token. | Intervalo de tiempo recomendado para sesiones largas (ej. 7 días). | `"7d"` |
| `RESEND_API_KEY` | Clave API secreta de Resend para despachar correos electrónicos. | Se obtiene en el panel de control de Resend (ver guía más abajo). | `re_123456789_abcdefg` |
| `EMAIL_FROM` | Dirección y nombre del remitente que verán los usuarios en los emails. | Debe tener el formato `"Nombre Remitente <correo@tudominio.com>"`. Si estás en modo prueba de Resend usa `"Auth OTP <onboarding@resend.dev>"`. Con dominio verificado, usa tu propio correo (ej. `noreply@tudominio.com`). | `"Auth OTP Service <onboarding@resend.dev>"` |
| `ADMIN_MASTER_KEY` | Clave maestra administrativa para gestionar proyectos y API Keys. | Genera una clave alfanumérica larga y segura (ej. con un generador de contraseñas o `openssl rand -hex 24`). | `"tu_clave_maestra_super_secreta_123456"` |
| `OTP_EXPIRATION_MINUTES` | Minutos de validez de cada código OTP emitido. | Número entero de minutos (por defecto `10`). | `10` |
| `OTP_MAX_ATTEMPTS` | Intentos fallidos permitidos antes de invalidar el código por seguridad. | Número entero (por defecto `3`). | `3` |
| `OTP_COOLDOWN_SECONDS` | Segundos de enfriamiento (cooldown) obligatorios entre solicitudes de OTP para el mismo correo. | Número entero (por defecto `60` segundos para prevenir spam). | `60` |

---

## 📧 Cómo Obtener la API Key de Resend

[Resend](https://resend.com) es la plataforma de entrega de correos transaccionales utilizada por este microservicio. Para obtener tu clave:

1. **Crear cuenta o iniciar sesión:**
   - Si no tienes cuenta, regístrate gratis en: [https://resend.com/signup](https://resend.com/signup).
   - Si ya tienes cuenta, inicia sesión en: [https://resend.com/login](https://resend.com/login).
2. **Acceder a la sección de API Keys:**
   - Dirígete al panel lateral o directamente al siguiente enlace: [https://resend.com/api-keys](https://resend.com/api-keys).
3. **Crear nueva API Key:**
   - Haz clic en el botón **"Create API Key"** (o **"Add API Key"**).
   - Asigna un nombre descriptivo a tu clave, por ejemplo: `otp-microservice-prod`.
   - Selecciona los permisos: **Full Access** (o **Sending access**).
   - Si tienes un dominio configurado, puedes asociarlo a ese dominio específico o dejarlo general.
   - Haz clic en **Add**.
4. **Copiar la clave:**
   - Copia la clave generada que inicia con `re_...` (guárdala de inmediato, ya que no se volverá a mostrar completa).
   - Pégala en tu archivo `.env` en la variable:
     ```env
     RESEND_API_KEY="re_tu_clave_aqui"
     ```

> 💡 **Nota sobre el remitente (`EMAIL_FROM`):**
> - **Modo Prueba (Sandbox):** Si no has configurado un dominio propio en Resend, solo puedes enviar correos desde `onboarding@resend.dev` y únicamente hacia el correo con el que te registraste en Resend.
> - **Modo Producción:** Para enviar correos a cualquier cliente o usuario, debes agregar y verificar tu dominio propio en [https://resend.com/domains](https://resend.com/domains) agregando los registros DNS (DKIM, SPF) que Resend te indique. Luego, configura `EMAIL_FROM="Mi App <hola@midominio.com>"`.

---

## 🗄️ Base de Datos con Prisma (Comandos y Configuración)

Este proyecto utiliza **Prisma ORM** con MySQL. Todos los modelos se encuentran definidos en [backend/prisma/schema.prisma](file:///Applications/send-otp/backend/prisma/schema.prisma).

### 1. Iniciar o sincronizar la Base de Datos (`db push`)
Aplica directamente los cambios del esquema a la base de datos sin generar archivos de migración (ideal para desarrollo rápido y primera inicialización):
```bash
npx prisma db push
```

### 2. Generar el Cliente y los Tipos de TypeScript (`generate`)
Genera los tipos actualizados de TypeScript basados en tu esquema:
```bash
npx prisma generate
```
*(Nota: `npx prisma db push` ejecuta `prisma generate` automáticamente).*

### 3. Ejecutar Migraciones en Desarrollo (`migrate dev`)
Si prefieres llevar un historial formal de migraciones SQL:
```bash
npx prisma migrate dev --name init
```
O usando el script del `package.json`:
```bash
npm run db:migrate
```

### 4. Ejecutar el Seed Inicial (Crear primer Proyecto y API Key)
El proyecto cuenta con un script de siembra ([backend/prisma/seed.ts](file:///Applications/send-otp/backend/prisma/seed.ts)) que crea el proyecto por defecto y genera tu primera **API Key**:
```bash
npx prisma db seed
```
O directamente con `tsx`:
```bash
npx tsx prisma/seed.ts
```
> ⚠️ **Atención:** La consola te mostrará en pantalla la `RAW API KEY`. **Cópiala y guárdala**, ya que en la base de datos solo se almacena su hash SHA-256.

### 5. Abrir Prisma Studio (Explorador Gráfico)
Para inspeccionar, editar y explorar visualmente las tablas (`projects`, `api_keys`, `otp_tokens`, `audit_logs`) desde tu navegador web:
```bash
npm run db:studio
# o: npx prisma studio
```
Se abrirá automáticamente en tu navegador en `http://localhost:5555`.

---

## 🛡️ Contraseña Master (Master Key) y API Keys para Otros Proyectos

### ¿Para qué sirve la Contraseña Master?
La variable `ADMIN_MASTER_KEY` definida en tu archivo `.env` es el **secreto maestro administrativo** que protege todos los endpoints de administración (`/api/v1/admin/*`).

* **Propósito:** Permite que únicamente tú (el administrador del microservicio) puedas:
  1. Dar de alta nuevos proyectos clientes o aplicaciones.
  2. Generar nuevas API Keys.
  3. Revocar API Keys comprometidas.
  4. Activar o suspender proyectos enteros.
  5. Consultar los registros de auditoría y trazabilidad.
* **Cómo se utiliza:** Se envía en las peticiones administrativas mediante el encabezado HTTP:
  ```http
  x-admin-key: tu_contraseña_master_del_env
  ```
* **Seguridad:** Esta clave jamás debe compartirse con los proyectos clientes; solo se utiliza entre el administrador o el dashboard de administración y el microservicio.

---

### Cómo generar API Keys para tus otros proyectos

Para que otro sistema o backend (por ejemplo: un eCommerce, un portal de usuarios, una app móvil, un SaaS) pueda consumir este microservicio, necesita su propia **API Key** (`x-api-key`).

#### Método 1: A través de la API Administrativa (Recomendado)
Realiza una petición `POST` al endpoint `/api/v1/admin/projects` enviando tu `x-admin-key`:

**Petición cURL:**
```bash
curl -X POST http://localhost:8000/api/v1/admin/projects \
  -H "Content-Type: application/json" \
  -H "x-admin-key: 7£bg0J\VI@X7EPu\"E?jHOjt£0e9-5Y/QIxi_e'c|tbrD'Dlv9'" \
  -d '{
    "name": "Plataforma de Clientes",
    "slug": "plataforma-clientes",
    "keyName": "Backend Clientes Producción",
    "description": "API Key para el servidor principal de clientes"
  }'
```

**Respuesta recibida:**
```json
{
  "success": true,
  "project": {
    "id": "e4f8d9b2-3c1a-4d5e-8f90-123456789abc",
    "name": "Plataforma de Clientes",
    "slug": "plataforma-clientes",
    "description": "API Key para el servidor principal de clientes"
  },
  "apiKey": {
    "name": "Backend Clientes Producción",
    "prefix": "auth_live_a1b2",
    "rawApiKey": "auth_live_a1b2c3d4e5f6789012345678abcdef0123456789abcdef01"
  }
}
```

> 🔒 **IMPORTANTE:** El valor `rawApiKey` es tu API Key secreta. **Guárdala de inmediato en el `.env` de tu otro proyecto** (por ejemplo como `OTP_SERVICE_API_KEY`). El microservicio solo guarda el hash SHA-256 en la base de datos y **no podrá recuperarla si la pierdes**.

#### Cómo usar la API Key en tu otro proyecto:
En el backend de tu otro proyecto, haz las llamadas a `/api/v1/otp/*` o `/api/v1/email/*` pasando el header:
```http
x-api-key: auth_live_a1b2c3d4e5f6789012345678abcdef0123456789abcdef01
```

---

## 🎨 Cómo Cambiar el Logo en las Plantillas de Correo

El microservicio incluye plantillas HTML para correos OTP, correos de verificación y correos personalizados. Tienes dos formas de cambiar el logo:

### Opción 1: Cambiar el logo por defecto en el código (Permanente)

El logo predeterminado se define en el archivo:
📁 [backend/src/modules/Email/infrastructure/templates/email.templates.ts](file:///Applications/send-otp/backend/src/modules/Email/infrastructure/templates/email.templates.ts)

1. Abre dicho archivo y localiza la línea 27:
   ```typescript
   const DEFAULT_LOGO_URL = 'https://pub-d05514d87a39422cbf9453e8ec02d871.r2.dev/send-otp.jpeg';
   ```
2. Reemplaza esa URL por la URL pública en HTTPS de tu propio logo:
   ```typescript
   const DEFAULT_LOGO_URL = 'https://tuservidor-o-cdn.com/assets/mi-logo.png';
   ```
3. Guarda el archivo. Todos los correos generados (OTP, Verificación y Personalizados) utilizarán automáticamente este nuevo logo si no se especifica uno diferente.

### Opción 2: Enviar un logo dinámico en la petición HTTP

Si estás utilizando el endpoint `/api/v1/email/send`, puedes enviar el parámetro opcional `logoUrl` directamente en el cuerpo JSON:
```json
{
  "to": "cliente@ejemplo.com",
  "subject": "Tu bienvenida",
  "htmlContent": "<p>Bienvenido a nuestra plataforma.</p>",
  "logoUrl": "https://midominio.com/logos/logo-especifico.png"
}
```

### 📐 Recomendaciones para el Logo:
- **Dimensiones:** Máximo `220px` de ancho por `80px` de alto (el contenedor tiene estilos para ajustarlo con `object-fit: contain`).
- **Formato:** PNG con fondo transparente o SVG/JPEG optimizado para web.
- **Alojamiento:** Debe ser una URL pública accesible vía `https://` (Cloudflare R2, AWS S3, Cloudinary o tu propio CDN). No uses rutas locales ni `localhost`.

---

## 📡 Documentación de Endpoints

URL Base en desarrollo: `http://localhost:8000`

---

### Health Check

#### `GET /health`
Verifica el estado del microservicio.
- **Headers:** Ninguno requerido.
- **Respuesta (200 OK):**
  ```json
  {
    "status": "ok",
    "service": "auth-otp-email-microservice",
    "timestamp": "2026-10-27T13:20:00.000Z"
  }
  ```

---

### Módulo OTP

Todos los endpoints de OTP requieren autenticación mediante el header `x-api-key`.

#### 1. Solicitar y Enviar Código OTP
- **Método y Ruta:** `POST /api/v1/otp/send`
- **Headers:**
  - `x-api-key: auth_live_...`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "type": "OTP"
  }
  ```
  *(Nota: `type` es opcional, valores posibles: `OTP`, `EMAIL_VERIFICATION`, `PASSWORD_RESET`).*
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Código OTP enviado correctamente",
    "expiresAt": "2026-10-27T13:30:00.000Z"
  }
  ```
- **Posibles Errores:**
  - `401 Unauthorized`: API key no proporcionada.
  - `403 Forbidden`: API key inválida o proyecto desactivado.
  - `429 Too Many Requests`: Cooldown activo (debes esperar 60 segundos entre envíos al mismo correo).

#### 2. Verificar Código OTP
- **Método y Ruta:** `POST /api/v1/otp/verify`
- **Headers:**
  - `x-api-key: auth_live_...`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "code": "849201",
    "type": "OTP"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "verified": true,
    "message": "Código verificado con éxito"
  }
  ```
- **Posibles Errores:**
  - `400 Bad Request`: "Código no encontrado o ya utilizado", "El código ha expirado", "Has superado el número máximo de intentos" o "Código incorrecto".

---

### Módulo Email

Todos los endpoints de Email requieren autenticación mediante el header `x-api-key`.

#### 1. Enviar Correo de Verificación de Cuenta
Envía un correo con diseño limpio y un botón con enlace de verificación.
- **Método y Ruta:** `POST /api/v1/email/send-verification`
- **Headers:**
  - `x-api-key: auth_live_...`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "nuevo-usuario@ejemplo.com",
    "redirectUrl": "https://miapp.com/auth/verify?token=xyz123abc"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Correo de verificación enviado correctamente"
  }
  ```

#### 2. Enviar Correo Personalizado (Plantilla con Logo)
Permite enviar contenido HTML libre dentro del contenedor estándar del microservicio con el logo central.
- **Método y Ruta:** `POST /api/v1/email/send`
- **Headers:**
  - `x-api-key: auth_live_...`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "to": "destinatario@ejemplo.com",
    "subject": "Actualización de tu suscripción",
    "htmlContent": "<p>Hola <strong>Carlos</strong>, tu plan ha sido actualizado satisfactoriamente.</p>",
    "logoUrl": "https://midominio.com/assets/logo-alt.png"
  }
  ```
  *(Nota: `to` puede ser un string con un correo o un arreglo de correos `["uno@ejemplo.com", "dos@ejemplo.com"]`. `logoUrl` es opcional).*
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "Correo enviado correctamente",
    "messageId": "0100018b-..."
  }
  ```

---

### Módulo Administración (Admin)

Todos los endpoints de administración están protegidos por el header `x-admin-key` (`ADMIN_MASTER_KEY`).

#### 1. Crear un Nuevo Proyecto y su API Key
- **Método y Ruta:** `POST /api/v1/admin/projects`
- **Headers:**
  - `x-admin-key: tu_contraseña_master`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "App Móvil Delivery",
    "slug": "app-movil-delivery",
    "keyName": "Backend Producción",
    "description": "API Key para el backend de delivery"
  }
  ```
- **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "project": {
      "id": "uuid-del-proyecto",
      "name": "App Móvil Delivery",
      "slug": "app-movil-delivery",
      "description": "API Key para el backend de delivery"
    },
    "apiKey": {
      "name": "Backend Producción",
      "prefix": "auth_live_xxxx",
      "rawApiKey": "auth_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  }
  ```

#### 2. Listar Todos los Proyectos
- **Método y Ruta:** `GET /api/v1/admin/projects`
- **Headers:**
  - `x-admin-key: tu_contraseña_master`
- **Respuesta Exitosa (200 OK):** Retorna la lista de proyectos con la cantidad de API Keys y tokens asociados.

#### 3. Activar o Suspender un Proyecto
- **Método y Ruta:** `PATCH /api/v1/admin/projects/:id/status`
- **Headers:**
  - `x-admin-key: tu_contraseña_master`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "isActive": false
  }
  ```
  *(Al desactivar un proyecto, todas sus API Keys quedan automáticamente suspendidas sin necesidad de borrarlas).*

#### 4. Revocar una API Key Específica
- **Método y Ruta:** `POST /api/v1/admin/keys/revoke`
- **Headers:**
  - `x-admin-key: tu_contraseña_master`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "apiKeyId": "uuid-de-la-api-key"
  }
  ```
- **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "message": "API Key revocada correctamente"
  }
  ```

#### 5. Consultar Registros de Auditoría
- **Método y Ruta:** `GET /api/v1/admin/audit?limit=20&projectId=uuid-opcional`
- **Headers:**
  - `x-admin-key: tu_contraseña_master`
- **Respuesta Exitosa (200 OK):** Retorna las últimas acciones registradas (`OTP_GENERATE`, `OTP_VERIFY`, `EMAIL_SENT`, `RATE_LIMITED`, `AUTH_FAILED`, etc.).

---

## 🚀 Comandos para Levantar el Servidor y Pruebas

### Modo Desarrollo (con recarga automática)
```bash
npm run dev
```
Inicia el microservicio con `nodemon` y `tsx`. La API estará disponible en `http://localhost:8000` (o el puerto configurado en `PORT`).

### Ejecutar Pruebas Automatizadas
El proyecto incluye pruebas completas con Vitest:
```bash
# Ejecutar todas las pruebas una vez
npm test

# Ejecutar pruebas en modo observador (watch)
npm run test:watch
```

### Compilar para Producción
```bash
# Compilar TypeScript a JavaScript con alias resueltos
npm run build

# Iniciar servidor compilado
npm start
```

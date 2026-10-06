# 🏗️ ARQUITECTURA DEL SISTEMA — MICROSERVICIO CENTRAL DE AUTENTICACIÓN, OTP Y EMAIL

Servicio backend centralizado diseñado bajo **Clean Architecture / Hexagonal Architecture** para gestionar autenticación server-to-server mediante API Keys criptográficas, generación/validación de códigos OTP seguros, verificación de correos electrónicos y trazabilidad mediante auditoría estructurada.

---

## 📑 Tabla de Contenido
1. [Objetivos y Principios](#-objetivos-y-principios)
2. [Diagrama de Arquitectura y Flujo](#-diagrama-de-arquitectura-y-flujo)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Patrón de Proveedor de Email (Email Provider Pattern)](#-patrón-de-proveedor-de-email-email-provider-pattern)
5. [Modelo de Datos y Persistencia (Prisma ORM)](#-modelo-de-datos-y-persistencia-prisma-orm)
6. [Seguridad y Criptografía](#-seguridad-y-criptografía)
7. [Documentación Completa de Endpoints](#-documentación-completa-de-endpoints)
8. [Variables de Entorno](#-variables-de-entorno)
9. [Guía de Inicio Rápido y Comandos](#-guía-de-inicio-rápido-y-comandos)
10. [Ejemplos de Integración (Server-to-Server)](#-ejemplos-de-integración-server-to-server)

---

## 🎯 Objetivos y Principios

* **Server-to-Server:** Diseñado exclusivamente para consumo backend entre plataformas, microservicios y clientes autorizados.
* **Aislamiento Multi-tenant por Proyectos:** Cada plataforma cliente está aislada bajo un `Project` con múltiples `ApiKey` independientes.
* **Cero Almacenamiento en Texto Plano:** Ni API Keys ni códigos OTP se guardan en texto plano en base de datos ni se registran en logs.
* **Provider Pattern Desacoplado:** El dominio define el contrato `IEmailProvider`. El envío con **Resend** es una implementación de infraestructura intercambiable sin afectar la lógica de negocio.
* **Resistencia a Ataques:**
  * Comparación constante con `crypto.timingSafeEqual` para prevenir Timing Attacks.
  * Invalidación atómica para prevenir Replay Attacks y Race Conditions.
  * Rate limiting y cooldown obligatorio de 60 segundos por correo/proyecto.
  * Límite estricto de intentos fallidos (máximo 3 intentos).
* **Trazabilidad Completa:** Cada acción relevante (`OTP_GENERATE`, `OTP_VERIFY`, `EMAIL_SENT`, `API_KEY_CREATED`, `API_KEY_REVOKED`, `RATE_LIMITED`, `AUTH_FAILED`) genera un registro en `audit_logs`.

---

## 📐 Diagrama de Arquitectura y Flujo

```
               [ Cliente / Plataforma Externa ]
                              │
               (x-api-key / x-admin-key)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CAPA HTTP / APP                        │
│  - Middleware: ApiKeyAuth / AdminAuth                       │
│  - Middleware: Zod Request Validation                       │
│  - Middleware: Structured Logger & Global Error Handler     │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                       │
│  - SendOtpUseCase            - VerifyOtpUseCase             │
│  - SendVerificationEmailUseCase                             │
│  - CreateProjectUseCase      - RevokeApiKeyUseCase          │
└──────────────┬──────────────────────────────┬───────────────┘
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      CAPA DE DOMINIO         │ │    PROVEEDORES / INFRA     │
│  - Project & ApiKey Entities │ │  - IEmailProvider          │
│  - OtpToken Entity           │ │    ├── ResendEmailProvider │
│  - AuditLog Entity           │ │    └── MockEmailProvider   │
│  - Crypto Utilities (SHA256) │ │  - Prisma Repositories     │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               ▼                              ▼
        [ Base de Datos MySQL ]           [ Resend API ]
```

---

## 📂 Estructura del Proyecto

```text
src/
├── app/
│   ├── middleware/
│   │   ├── ApiKeyAuth.middleware.ts    # Validador de header x-api-key y proyectos activos
│   │   ├── AdminAuth.middleware.ts     # Validador de x-admin-key (ADMIN_MASTER_KEY)
│   │   ├── Validated.middleware.ts     # Validador universal de schemas Zod
│   │   └── Error.middleware.ts         # Manejo centralizado de respuestas y errores
│   └── http/
│       └── response.http.ts
│
├── modules/
│   ├── Projects/                       # Módulo de Proyectos y API Keys
│   │   ├── projects.module.ts          # Composition Root (instancia repos, use cases y adminController)
│   │   ├── domain/                     # Entidades y Contrato IProjectsRepository
│   │   ├── application/                # CreateProject, RevokeKey, SetStatus UseCases
│   │   ├── infrastructure/             # PrismaProjectsRepository y Mappers
│   │   └── presentation/               # AdminController, AdminRoutes, Zod Schemas
│   │
│   ├── Otp/                            # Módulo de Generación y Validación OTP
│   │   ├── otp.module.ts               # Composition Root (instancia repos, use cases y otpController)
│   │   ├── domain/                     # Entidad OtpToken y Contrato IOtpRepository
│   │   ├── application/                # SendOtpUseCase, VerifyOtpUseCase
│   │   ├── infrastructure/             # PrismaOtpRepository (transaccional/atómico)
│   │   └── presentation/               # OtpController, OtpRoutes, Zod Schemas
│   │
│   ├── Email/                          # Módulo de Email & Proveedores
│   │   ├── email.module.ts             # Composition Root (instancia provider, use cases y emailController)
│   │   ├── domain/
│   │   │   └── email.provider.ts       # Contrato / Interface IEmailProvider
│   │   ├── infrastructure/
│   │   │   ├── resend-email.provider.ts # Implementación oficial con Resend SDK
│   │   │   └── mock-email.provider.ts   # Proveedor en memoria para pruebas
│   │   ├── application/                # SendVerificationEmailUseCase
│   │   └── presentation/               # EmailController, EmailRoutes, Schemas
│   │
│   └── Audit/                          # Módulo de Auditoría y Trazabilidad
│       ├── audit.module.ts             # Composition Root (instancia repositorio y use cases de auditoría)
│       ├── domain/                     # Entidad AuditLog y Contrato IAuditRepository
│       ├── application/                # CreateAuditLog, ListAuditLogs UseCases
│       └── infrastructure/             # PrismaAuditRepository y Mappers
│
├── shared/
│   ├── config/
│   │   └── env.config.ts               # Configuración tipada de variables de entorno
│   ├── errors/
│   │   └── AppError.ts                 # Error de aplicación estándar con statusCode
│   ├── logger/
│   │   └── logger.ts                   # Logger estructurado con sanitización de secretos
│   ├── tasks/
│   │   └── otp-cleanup.task.ts         # Tarea periódica de purga de tokens expirados
│   └── utils/
│       └── crypto.util.ts              # Generación segura, hashing SHA-256 y safeTimingCompare
│
├── routes/
│   └── index.routes.ts                 # Enrutador principal (/api/v1/*)
├── app.ts                              # Configuración de Express, CORS y Middlewares
└── server.ts                           # Arranque de servidor y ciclo de vida
```

---

## 📧 Patrón de Proveedor de Email (Email Provider Pattern)

Para garantizar desacoplamiento total de proveedores externos (Resend, SendGrid, AWS SES, Mailgun, etc.), el sistema implementa la interfaz en `src/modules/Email/domain/email.provider.ts`:

```typescript
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
  sendOtpEmail(email: string, otpCode: string, expirationMinutes: number, projectName?: string): Promise<SendEmailResult>;
  sendVerificationEmail(email: string, verificationUrl: string, projectName?: string): Promise<SendEmailResult>;
}
```

### Implementaciones:
1. **`ResendEmailProvider`**: Usa `resend` oficial, inyectando plantillas HTML estilizadas con modo oscuro profesional y fallback a texto plano.
2. **`MockEmailProvider`**: Guarda envíos en memoria para pruebas automatizadas e integración sin agotar cuota.

---

## 🗄️ Modelo de Datos y Persistencia (Prisma ORM)

```prisma
enum TokenType {
  OTP
  EMAIL_VERIFICATION
  PASSWORD_RESET
}

enum AuditAction {
  PROJECT_CREATE
  PROJECT_UPDATE
  API_KEY_CREATED
  API_KEY_REVOKED
  OTP_GENERATE
  OTP_VERIFY
  EMAIL_SENT
  AUTH_FAILED
  RATE_LIMITED
}

model Project {
  id          String     @id @default(uuid())
  name        String     @db.VarChar(100)
  slug        String     @unique @db.VarChar(100)
  description String?    @db.Text
  isActive    Boolean    @default(true) @map("is_active")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  apiKeys   ApiKey[]
  otpTokens OtpToken[]
  auditLogs AuditLog[]

  @@map("projects")
}

model ApiKey {
  id         String    @id @default(uuid())
  projectId  String    @map("project_id")
  name       String    @db.VarChar(100)
  prefix     String    @db.VarChar(20)
  keyHash    String    @unique @map("key_hash") @db.VarChar(255)
  isActive   Boolean   @default(true) @map("is_active")
  lastUsedAt DateTime? @map("last_used_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([keyHash, isActive])
  @@index([projectId])
  @@map("api_keys")
}

model OtpToken {
  id             String    @id @default(uuid())
  projectId      String    @map("project_id")
  recipientEmail String    @map("recipient_email") @db.VarChar(255)
  codeHash       String    @map("code_hash") @db.VarChar(255)
  type           TokenType @default(OTP)
  attempts       Int       @default(0)
  maxAttempts    Int       @default(3) @map("max_attempts")
  isUsed         Boolean   @default(false) @map("is_used")
  expiresAt      DateTime  @map("expires_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, recipientEmail, type, isUsed, createdAt])
  @@index([projectId, recipientEmail, createdAt])
  @@index([projectId])
  @@index([expiresAt])
  @@map("otp_tokens")
}

model AuditLog {
  id        String      @id @default(uuid())
  projectId String?     @map("project_id")
  action    AuditAction
  resource  String      @db.VarChar(100)
  details   Json?
  createdAt DateTime    @default(now()) @map("created_at")

  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## 🔒 Seguridad y Criptografía

| Componente | Mecanismo de Seguridad |
| :--- | :--- |
| **Generación de API Keys** | `crypto.randomBytes(24)` formato `auth_live_<hex>`. |
| **Almacenamiento de API Keys** | Únicamente se guarda `SHA-256(rawApiKey)` y `prefix` (primeros 14 caracteres). |
| **Generación de OTP** | `crypto.randomInt(0, 1000000)` con padding a exactamente 6 dígitos. |
| **Almacenamiento de OTP** | Únicamente se guarda `SHA-256(code)`. |
| **Comparación de Hashes** | `crypto.timingSafeEqual` con buffers de longitud constante (inmune a timing attacks). |
| **Prevención de Replay** | Transacción atómica que marca `isUsed = true`. Un segundo intento falla con 400. |
| **Rate Limiting / Cooldown** | Cooldown de 60 segundos por correo/proyecto (`RATE_LIMITED` en auditoría). |
| **Límite de Intentos** | Máximo 3 intentos fallidos por OTP. Cada intento incorrecto incrementa el contador. |
| **Sanitización de Logs** | Todos los logs pasan por filtro que ofusca `rawApiKey`, `otp`, `code`, `adminMasterKey`, etc. |

---

## 📡 Documentación Completa de Endpoints

### Formato de Respuestas

#### Respuesta Exitosa (200 / 201)
```json
{
  "success": true,
  "message": "Operación completada con éxito"
}
```

#### Respuesta de Error (400 / 401 / 403 / 429 / 500)
```json
{
  "success": false,
  "error": "Descripción clara del error sin exponer trazas internas"
}
```

---

### 1. Enviar Código OTP
* **Ruta:** `POST /api/v1/otp/send`
* **Headers:**
  * `x-api-key: auth_live_...`
  * `Content-Type: application/json`
* **Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "type": "OTP"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Código OTP enviado correctamente",
  "expiresAt": "2026-10-05T12:05:00.000Z"
}
```
* **Errores Comunes:**
  * `401 Unauthorized`: API key requerida.
  * `403 Forbidden`: API key inválida o proyecto inactivo.
  * `429 Too Many Requests`: Por favor espera 1 minuto antes de solicitar otro código.

---

### 2. Verificar Código OTP
* **Ruta:** `POST /api/v1/otp/verify`
* **Headers:**
  * `x-api-key: auth_live_...`
  * `Content-Type: application/json`
* **Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "code": "481920",
  "type": "OTP"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "verified": true,
  "message": "Código verificado con éxito"
}
```
* **Errores Comunes:**
  * `400 Bad Request`: "Código no encontrado o ya utilizado", "El código ha expirado", "Has superado el número máximo de intentos", "Código incorrecto".

---

### 3. Enviar Correo de Verificación
* **Ruta:** `POST /api/v1/email/send-verification`
* **Headers:**
  * `x-api-key: auth_live_...`
  * `Content-Type: application/json`
* **Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "redirectUrl": "https://mi-plataforma.com/verificar-cuenta"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Correo de verificación enviado correctamente"
}
```

---

### 4. Enviar Correo Personalizado (HTML Libre con Plantilla Centralizada)
* **Ruta:** `POST /api/v1/email/send`
* **Headers:**
  * `x-api-key: auth_live_...`
  * `Content-Type: application/json`
* **Body:**
```json
{
  "to": "usuario@ejemplo.com",
  "subject": "Notificación Importante",
  "htmlContent": "<p>Hola <strong>Juan</strong>, tu pedido ha sido procesado exitosamente.</p>",
  "logoUrl": "https://pub-59913b0c53f044ad8a24e05f6a21ed2e.r2.dev/assets/logo-cad.png"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Correo enviado correctamente",
  "messageId": "01a10e73-..."
}
```

---

### 5. Crear Proyecto y Generar API Key (Admin)
* **Ruta:** `POST /api/v1/admin/projects`
* **Headers:**
  * `x-admin-key: super_secret_admin_master_key_123456`
  * `Content-Type: application/json`
* **Body:**
```json
{
  "name": "E-commerce Tienda",
  "slug": "ecommerce-tienda",
  "keyName": "Backend Server Producción",
  "description": "Plataforma principal de compras"
}
```
* **Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "project": {
    "id": "c5a6b7c8-9d0e-1f2a-3b4c-5d6e7f8a9b0c",
    "name": "E-commerce Tienda",
    "slug": "ecommerce-tienda",
    "description": "Plataforma principal de compras"
  },
  "apiKey": {
    "name": "Backend Server Producción",
    "prefix": "auth_live_9f8e",
    "rawApiKey": "auth_live_9f8e7d6c5b4a3928170e1f2a3b4c5d6e7f8a9b0c1d2e3f4a"
  }
}
```
> ⚠️ **IMPORTANTE:** `rawApiKey` se muestra **única y exclusivamente** en esta respuesta. En la base de datos se almacena únicamente el hash SHA-256.

---

### 5. Revocar API Key (Admin)
* **Ruta:** `POST /api/v1/admin/keys/revoke`
* **Headers:**
  * `x-admin-key: super_secret_admin_master_key_123456`
* **Body:**
```json
{
  "apiKeyId": "uuid-de-la-llave"
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "API Key revocada correctamente"
}
```

---

### 6. Activar o Desactivar Proyecto (Admin)
* **Ruta:** `PATCH /api/v1/admin/projects/:id/status`
* **Headers:**
  * `x-admin-key: super_secret_admin_master_key_123456`
* **Body:**
```json
{
  "isActive": false
}
```
* **Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "project": {
    "id": "uuid-del-proyecto",
    "name": "E-commerce Tienda",
    "slug": "ecommerce-tienda",
    "isActive": false
  }
}
```
> Cuando un proyecto tiene `isActive: false`, todas sus API Keys quedan automáticamente bloqueadas.

---

### 7. Consultar Registros de Auditoría (Admin)
* **Ruta:** `GET /api/v1/admin/audit?limit=20&projectId=uuid`
* **Headers:**
  * `x-admin-key: super_secret_admin_master_key_123456`

---

## ⚙️ Variables de Entorno

```env
# Base de Datos
DATABASE_URL="mysql://root:password@localhost:3306/otp_microservice_db"

# Servidor
PORT=3000
NODE_ENV=development

# Proveedor Resend
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM="Auth OTP Service <onboarding@resend.dev>"

# Master Key Administrativa
ADMIN_MASTER_KEY="super_secret_admin_master_key_123456"

# Configuración OTP
OTP_EXPIRATION_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_COOLDOWN_SECONDS=60
```

---

## 🚀 Guía de Inicio Rápido y Comandos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Sincronizar Base de Datos con Prisma
```bash
npx prisma db push
```

### 3. Ejecutar Seed Inicial (Crea el primer proyecto y API Key)
```bash
npm run seed  # o: npx tsx prisma/seed.ts
```

### 4. Ejecutar Suite Completa de Pruebas Automatizadas
```bash
npm test
```

### 5. Iniciar Servidor en Desarrollo
```bash
npm run dev
```

---

## 💻 Ejemplos de Integración (Server-to-Server)

### Node.js (Fetch API)

```typescript
const OTP_SERVICE_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'auth_live_tu_api_key_aqui';

// 1. Enviar OTP
async function sendOtp(email: string) {
  const response = await fetch(`${OTP_SERVICE_URL}/otp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ email, type: 'OTP' }),
  });
  return response.json();
}

// 2. Validar OTP
async function verifyOtp(email: string, code: string) {
  const response = await fetch(`${OTP_SERVICE_URL}/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({ email, code, type: 'OTP' }),
  });
  return response.json();
}
```

### cURL

```bash
# Solicitar OTP
curl -X POST http://localhost:3000/api/v1/otp/send \
  -H "x-api-key: auth_live_tu_llave" \
  -H "Content-Type: application/json" \
  -d '{"email": "cliente@ejemplo.com", "type": "OTP"}'

# Validar OTP
curl -X POST http://localhost:3000/api/v1/otp/verify \
  -H "x-api-key: auth_live_tu_llave" \
  -H "Content-Type: application/json" \
  -d '{"email": "cliente@ejemplo.com", "code": "123456", "type": "OTP"}'
```

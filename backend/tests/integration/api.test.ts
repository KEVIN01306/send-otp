import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/infrastructure/config/prisma/prisma.config.js';
import { config } from '../../src/shared/config/env.config.js';

describe('API Integration Tests', () => {
  let createdProjectId: string;
  let rawApiKey: string;
  let apiKeyId: string;
  const adminKey = config.adminMasterKey;

  beforeAll(async () => {
    // Clean up test projects
    await prisma.project.deleteMany({
      where: {
        slug: {
          in: ['integration-test-project', 'temp-test-project'],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.project.deleteMany({
      where: {
        slug: {
          in: ['integration-test-project', 'temp-test-project'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('GET /health should return 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Admin Endpoints (/api/v1/admin)', () => {
    it('should reject requests without x-admin-key (401)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects')
        .send({
          name: 'Test Project',
          slug: 'integration-test-project',
          keyName: 'Test Key',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid x-admin-key (403)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects')
        .set('x-admin-key', 'wrong_admin_master_key')
        .send({
          name: 'Test Project',
          slug: 'integration-test-project',
          keyName: 'Test Key',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should successfully create a project and return rawApiKey once (201)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects')
        .set('x-admin-key', adminKey)
        .send({
          name: 'Integration Test Project',
          slug: 'integration-test-project',
          keyName: 'Backend Service Key',
          description: 'Project used for automated integration tests',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.project.slug).toBe('integration-test-project');
      expect(res.body.apiKey.rawApiKey).toMatch(/^auth_live_/);
      expect(res.body.apiKey.prefix).toBeDefined();

      createdProjectId = res.body.project.id;
      rawApiKey = res.body.apiKey.rawApiKey;
    });

    it('should reject duplicate project slug (400)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/projects')
        .set('x-admin-key', adminKey)
        .send({
          name: 'Integration Test Project Duplicate',
          slug: 'integration-test-project',
          keyName: 'Backend Key 2',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('ya existe');
    });

    it('should list projects via admin endpoint (200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/projects')
        .set('x-admin-key', adminKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list audit logs via admin endpoint (200)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit')
        .set('x-admin-key', adminKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('API Key Authentication Middleware', () => {
    it('should reject requests without x-api-key header (401)', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .send({
          email: 'test@example.com',
          type: 'OTP',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('API key requerida');
    });

    it('should reject requests with invalid x-api-key (403)', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .set('x-api-key', 'auth_live_invalid_key_9999999999999999')
        .send({
          email: 'test@example.com',
          type: 'OTP',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('API key inválida');
    });
  });

  describe('OTP Endpoints (/api/v1/otp)', () => {
    const testEmail = 'delivered@resend.dev';

    it('should validate request body schema (400 for invalid email)', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .set('x-api-key', rawApiKey)
        .send({
          email: 'invalid-email-format',
          type: 'OTP',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should send an OTP successfully (200)', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .set('x-api-key', rawApiKey)
        .send({
          email: testEmail,
          type: 'OTP',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Código OTP enviado correctamente');
      expect(res.body.expiresAt).toBeDefined();
    });

    it('should enforce cooldown period / rate limiting on immediate subsequent request (429)', async () => {
      const res = await request(app)
        .post('/api/v1/otp/send')
        .set('x-api-key', rawApiKey)
        .send({
          email: testEmail,
          type: 'OTP',
        });

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('espera 1 minuto');
    });

    it('should reject verification with incorrect OTP code (400)', async () => {
      const res = await request(app)
        .post('/api/v1/otp/verify')
        .set('x-api-key', rawApiKey)
        .send({
          email: testEmail,
          code: '000000',
          type: 'OTP',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Código incorrecto');
    });

    it('should verify correctly when valid OTP code is supplied', async () => {
      // Find the token in DB for testing
      const token = await prisma.otpToken.findFirst({
        where: {
          recipientEmail: testEmail,
          projectId: createdProjectId,
          isUsed: false,
        },
      });
      expect(token).toBeDefined();

      // Mock update to a known hash: SHA256("654321") = ...
      const knownCode = '654321';
      const { CryptoUtil } = await import('../../src/shared/utils/crypto.util.js');
      const knownHash = CryptoUtil.hashSha256(knownCode);

      await prisma.otpToken.update({
        where: { id: token!.id },
        data: { codeHash: knownHash },
      });

      const res = await request(app)
        .post('/api/v1/otp/verify')
        .set('x-api-key', rawApiKey)
        .send({
          email: testEmail,
          code: knownCode,
          type: 'OTP',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verified).toBe(true);

      // Replay attack prevention: second attempt must fail
      const replayRes = await request(app)
        .post('/api/v1/otp/verify')
        .set('x-api-key', rawApiKey)
        .send({
          email: testEmail,
          code: knownCode,
          type: 'OTP',
        });

      expect(replayRes.status).toBe(400);
      expect(replayRes.body.success).toBe(false);
      expect(replayRes.body.error).toBe('Código no encontrado o ya utilizado');
    });
  });

  describe('Project & Key Revocation Enforcement', () => {
    it('should block API requests when project is deactivated (403)', async () => {
      // Deactivate project
      await request(app)
        .patch(`/api/v1/admin/projects/${createdProjectId}/status`)
        .set('x-admin-key', adminKey)
        .send({ isActive: false });

      const res = await request(app)
        .post('/api/v1/otp/send')
        .set('x-api-key', rawApiKey)
        .send({
          email: 'deactivated-project@example.com',
          type: 'OTP',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('El proyecto se encuentra inactivo');

      // Reactivate project
      await request(app)
        .patch(`/api/v1/admin/projects/${createdProjectId}/status`)
        .set('x-admin-key', adminKey)
        .send({ isActive: true });
    });

    it('should block API requests when API Key is revoked (403)', async () => {
      // Find key id in DB
      const keyRecord = await prisma.apiKey.findFirst({
        where: { projectId: createdProjectId },
      });

      expect(keyRecord).toBeDefined();

      // Revoke key
      const revokeRes = await request(app)
        .post('/api/v1/admin/keys/revoke')
        .set('x-admin-key', adminKey)
        .send({ apiKeyId: keyRecord!.id });

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.success).toBe(true);

      // Attempt to use revoked key
      const res = await request(app)
        .post('/api/v1/otp/send')
        .set('x-api-key', rawApiKey)
        .send({
          email: 'revoked-key@example.com',
          type: 'OTP',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('API key inválida');
    });
  });

  describe('Email Verification Endpoints (/api/v1/email)', () => {
    it('should validate redirectUrl (400 if invalid)', async () => {
      // Re-create a valid project & key for this test
      const projectRes = await request(app)
        .post('/api/v1/admin/projects')
        .set('x-admin-key', adminKey)
        .send({
          name: 'Email Test Project',
          slug: 'temp-test-project',
          keyName: 'Email Test Key',
        });

      const validKey = projectRes.body.apiKey.rawApiKey;

      const res = await request(app)
        .post('/api/v1/email/send-verification')
        .set('x-api-key', validKey)
        .send({
          email: 'delivered@resend.dev',
          redirectUrl: 'invalid-url',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should send email verification successfully (200)', async () => {
      const projectRes = await prisma.project.findUnique({
        where: { slug: 'temp-test-project' },
        include: { apiKeys: true },
      });

      // Query raw api key or create fresh one
      const keyRes = await request(app)
        .post('/api/v1/admin/projects')
        .set('x-admin-key', adminKey)
        .send({
          name: 'Temp Project 2',
          slug: `temp-slug-${Date.now()}`,
          keyName: 'Temp Key',
        });

      const key = keyRes.body.apiKey.rawApiKey;

      const res = await request(app)
        .post('/api/v1/email/send-verification')
        .set('x-api-key', key)
        .send({
          email: 'delivered@resend.dev',
          redirectUrl: 'https://example.com/verify-account',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Correo de verificación enviado correctamente');
    });

    it('should send custom HTML email successfully (200)', async () => {
      const keyRes = await request(app)
        .post('/api/v1/admin/projects')
        .set('x-admin-key', adminKey)
        .send({
          name: 'Custom Email Test Project',
          slug: `custom-email-${Date.now()}`,
          keyName: 'Custom Email Key',
        });

      const key = keyRes.body.apiKey.rawApiKey;

      const res = await request(app)
        .post('/api/v1/email/send')
        .set('x-api-key', key)
        .send({
          to: 'delivered@resend.dev',
          subject: 'Bienvenido a nuestro sistema',
          htmlContent: '<p>Hola! Tu cuenta ha sido activada con éxito. Puedes ingresar a tu panel ahora mismo.</p>',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Correo enviado correctamente');
    });
  });
});

export interface OtpEmailTemplateParams {
  otpCode: string;
  expirationMinutes: number;
  projectName?: string;
  logoUrl?: string;
}

export interface VerificationEmailTemplateParams {
  verificationUrl: string;
  projectName?: string;
  logoUrl?: string;
}

export interface CustomEmailTemplateParams {
  htmlContent: string;
  subject: string;
  projectName?: string;
  logoUrl?: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const DEFAULT_LOGO_URL = 'https://pub-59913b0c53f044ad8a24e05f6a21ed2e.r2.dev/assets/logo-cad.png';

/**
 * Plantilla minimalista y directa para códigos OTP.
 * Logo grande centrado, texto pequeño de origen, código grande libre de cajas y tiempo de expiración.
 */
export function getOtpEmailTemplate(params: OtpEmailTemplateParams): EmailContent {
  const projectName = params.projectName || 'Autenticación';
  const logoUrl = params.logoUrl || DEFAULT_LOGO_URL;
  const subject = `Tu código de verificación - ${projectName}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f0f9ff;
      color: #1e293b;
      margin: 0;
      padding: 40px 16px;
    }
    .wrapper {
      max-width: 480px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.06);
    }
    .logo-container {
      margin-bottom: 28px;
      text-align: center;
    }
    .logo {
      max-width: 220px;
      max-height: 80px;
      height: auto;
      display: inline-block;
      object-fit: contain;
    }
    .origin-text {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 16px 0;
    }
    .code {
      font-size: 46px;
      font-weight: 700;
      letter-spacing: 12px;
      color: #0f172a;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      margin: 28px 0;
      text-align: center;
    }
    .expiry-text {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-container">
      <img src="${logoUrl}" alt="${projectName}" class="logo" />
    </div>
    
    <p class="origin-text">Código de verificación para <strong>${projectName}</strong></p>
    
    <div class="code">${params.otpCode}</div>
    
    <p class="expiry-text">Este código vence en ${params.expirationMinutes} minutos.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `Código de verificación para ${projectName}:\n\n${params.otpCode}\n\nEste código vence en ${params.expirationMinutes} minutos.`;

  return {
    subject,
    html,
    text,
  };
}

/**
 * Plantilla minimalista para verificación de cuentas vía enlace.
 */
export function getVerificationEmailTemplate(params: VerificationEmailTemplateParams): EmailContent {
  const projectName = params.projectName || 'Servicio de Autenticación';
  const logoUrl = params.logoUrl || DEFAULT_LOGO_URL;
  const subject = `Verifica tu correo electrónico - ${projectName}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f0f9ff;
      color: #1e293b;
      margin: 0;
      padding: 40px 16px;
    }
    .wrapper {
      max-width: 480px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.06);
    }
    .logo-container {
      margin-bottom: 28px;
      text-align: center;
    }
    .logo {
      max-width: 220px;
      max-height: 80px;
      height: auto;
      display: inline-block;
      object-fit: contain;
    }
    .origin-text {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 24px 0;
    }
    .button {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .link-alt {
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-container">
      <img src="${logoUrl}" alt="${projectName}" class="logo" />
    </div>
    
    <p class="origin-text">Verifica tu cuenta para <strong>${projectName}</strong></p>
    
    <a href="${params.verificationUrl}" class="button" target="_blank">Verificar mi correo</a>
    
    <p class="link-alt">${params.verificationUrl}</p>
  </div>
</body>
</html>
  `.trim();

  const text = `Verifica tu correo electrónico para ${projectName} ingresando al siguiente enlace:\n${params.verificationUrl}`;

  return {
    subject,
    html,
    text,
  };
}

/**
 * Plantilla para correos personalizados con logo central e inserción de HTML arbitrario.
 */
export function getCustomEmailTemplate(params: CustomEmailTemplateParams): EmailContent {
  const projectName = params.projectName || 'Notificación';
  const logoUrl = params.logoUrl || DEFAULT_LOGO_URL;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f0f9ff;
      color: #1e293b;
      margin: 0;
      padding: 40px 16px;
    }
    .wrapper {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 40px 32px;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.06);
    }
    .logo-container {
      margin-bottom: 28px;
      text-align: center;
    }
    .logo {
      max-width: 220px;
      max-height: 80px;
      height: auto;
      display: inline-block;
      object-fit: contain;
    }
    .content {
      font-size: 15px;
      color: #334155;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-container">
      <img src="${logoUrl}" alt="${projectName}" class="logo" />
    </div>
    
    <div class="content">
      ${params.htmlContent}
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: params.subject,
    html,
    text: params.htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  };
}

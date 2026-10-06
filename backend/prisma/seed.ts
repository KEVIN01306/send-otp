import { PrismaClient, AuditAction } from '@prisma/client';
import { CryptoUtil } from '../src/shared/utils/crypto.util.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Ejecutando seed de inicialización...');

    // Check if default project exists
    const existingProject = await prisma.project.findUnique({
        where: { slug: 'default-app' },
    });

    if (!existingProject) {
        console.log('📦 Creando proyecto por defecto: "Default App"');

        const project = await prisma.project.create({
            data: {
                name: 'Default App',
                slug: 'default-app',
                description: 'Proyecto por defecto para integración y desarrollo',
                isActive: true,
            },
        });

        const rawApiKey = CryptoUtil.generateApiKey();
        const prefix = CryptoUtil.extractPrefix(rawApiKey);
        const keyHash = CryptoUtil.hashSha256(rawApiKey);

        const apiKey = await prisma.apiKey.create({
            data: {
                projectId: project.id,
                name: 'Development Master Key',
                prefix,
                keyHash,
                isActive: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                projectId: project.id,
                action: AuditAction.API_KEY_CREATED,
                resource: 'api_key',
                details: {
                    apiKeyId: apiKey.id,
                    prefix: apiKey.prefix,
                    name: apiKey.name,
                },
            },
        });

        console.log('✅ Proyecto y API Key inicial creados con éxito.');
        console.log('====================================================');
        console.log(`📌 Project ID: ${project.id}`);
        console.log(`📌 Project Slug: ${project.slug}`);
        console.log(`🔑 RAW API KEY (Guardar ahora, se muestra una sola vez):`);
        console.log(`👉 ${rawApiKey}`);
        console.log('====================================================');
    } else {
        console.log('ℹ️ El proyecto "default-app" ya existe en la base de datos.');
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error durante la ejecución del seed:', e);
        await prisma.$disconnect();
    });
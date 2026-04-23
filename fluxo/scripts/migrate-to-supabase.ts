import { PrismaClient } from '@prisma/client';

const railwayUrl = "postgresql://postgres:pXgQQPebySgUCozpYaDbxHuGcFsGsPsV@centerbeam.proxy.rlwy.net:47892/railway";
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.error("ERRO: Defina a variável de ambiente SUPABASE_URL");
  process.exit(1);
}

const source = new PrismaClient({
  datasources: { db: { url: railwayUrl } },
});

const target = new PrismaClient({
  datasources: { db: { url: supabaseUrl } },
});

async function main() {
  console.log('🚀 Iniciando migração de dados Railway -> Supabase...');

  // Ordem de migração para respeitar fkeys
  const tables = [
    'tenant',
    'user',
    'tenantUser',
    'customer',
    'financialContact',
    'customerNote',
    'invoice',
    'invoiceInstallment',
    'billingFlow',
    'communication',
    'messageQueue',
    'paymentPromise',
    'activityLog',
    'task',
    'communicationLog',
    'passwordResetToken',
    'emailVerificationToken',
    'rateLimit',
    'stripeEvent'
  ];

  for (const table of tables) {
    console.log(`📦 Migrando tabela: ${table}...`);
    try {
      // @ts-ignore
      const data = await source[table].findMany();
      if (data.length > 0) {
        // @ts-ignore
        await target[table].createMany({
          data,
          skipDuplicates: true,
        });
        console.log(`✅ ${data.length} registros migrados para ${table}.`);
      } else {
        console.log(`ℹ️ Tabela ${table} está vazia.`);
      }
    } catch (err) {
      console.error(`❌ Erro em ${table}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log('✨ Migração concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });

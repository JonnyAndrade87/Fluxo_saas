import { NextRequest, NextResponse } from "next/server";
import { cleanOldCommunicationLogs } from "@/lib/lgpd";
import { prisma } from "@/lib/prisma";

// Proteção para garantir que a rota só seja chamada pelo Vercel Cron
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscamos todos os tenants ativos no momento
    const tenants = await prisma.tenant.findMany({ select: { id: true } });
    
    let totalCleaned = 0;
    
    // Roda a limpeza de mensagens com mais de 90 dias para cada tenant
    for (const tenant of tenants) {
      const count = await cleanOldCommunicationLogs(tenant.id, 90);
      totalCleaned += count;
    }

    return NextResponse.json({
      success: true,
      message: `Rotina de limpeza LGPD concluída. Total de mensagens higienizadas: ${totalCleaned}`
    });
  } catch (error) {
    console.error("[LGPD Cron] Erro na limpeza de dados antigos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

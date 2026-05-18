import { NextRequest, NextResponse } from "next/server";
import { anonymizeCustomer } from "@/lib/lgpd";
import { verifyInternalEndpointAuth } from "@/lib/internalEndpointAuth";

export async function POST(req: NextRequest) {
  try {
    // Validação de segurança: apenas chamadas internas/autorizadas (ex: painel admin ou webhook n8n com token)
    const isAuthorized = await verifyInternalEndpointAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, customerId } = body;

    if (!tenantId || !customerId) {
      return NextResponse.json({ error: "tenantId and customerId are required" }, { status: 400 });
    }

    const success = await anonymizeCustomer(tenantId, customerId);

    if (success) {
      return NextResponse.json({ message: "Customer anonymized successfully" });
    } else {
      return NextResponse.json({ error: "Failed to anonymize customer or customer not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("[LGPD API] Erro no endpoint de anonimização:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

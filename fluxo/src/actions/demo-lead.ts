'use server';

import { sendEmail, getAuthEmailFrom } from '@/lib/messaging/email';
import prisma from "@/lib/prisma";
import { z } from "zod";

const leadSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  company: z.string().min(2, "Empresa é obrigatória"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp é obrigatório"),
  monthlyVolume: z.string().min(1, "Volume é obrigatório"),
});

export type LeadActionState = {
  success: boolean;
  error: string;
  message: string;
  data?: {
    email: string;
    whatsapp: string;
  };
};

export async function submitDemoLead(prevState: any, formData: FormData): Promise<LeadActionState> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      email: formData.get("email") as string,
      whatsapp: formData.get("whatsapp") as string,
      monthlyVolume: formData.get("monthlyVolume") as string,
    };

    const validatedData = leadSchema.parse(rawData);

    // 1. Salvar no banco de dados
    const lead = await prisma.lead.create({
      data: {
        name: validatedData.name,
        company: validatedData.company,
        email: validatedData.email,
        whatsapp: validatedData.whatsapp,
        monthlyVolume: validatedData.monthlyVolume,
        source: "lp_fluxeer",
      },
    });

    // 2. Notificar comercial via e-mail
    const commercialEmail = process.env.RESEND_FROM_EMAIL || 'comercial@fluxeer.com.br';
    
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2> Novo Lead da Landing Page 🎉</h2>
        <p><strong>Nome:</strong> ${validatedData.name}</p>
        <p><strong>Empresa:</strong> ${validatedData.company}</p>
        <p><strong>E-mail:</strong> ${validatedData.email}</p>
        <p><strong>WhatsApp:</strong> ${validatedData.whatsapp}</p>
        <p><strong>Volume Mensal:</strong> ${validatedData.monthlyVolume}</p>
        <p>Este lead solicitou uma demonstração através da nova Landing Page Pública.</p>
      </div>
    `;

    const result = await sendEmail({
      to: commercialEmail,
      from: getAuthEmailFrom(),
      subject: `🚨 Novo Lead Fluxeer: ${validatedData.company}`,
      html: htmlBody,
    });

    if (!result.success && process.env.NODE_ENV !== 'development') {
        console.warn('E-mail não disparado por falta de config, mas salvo no DB.');
    }

    return { 
      success: true, 
      message: 'Solicitação enviada com sucesso!', 
      error: '',
      data: {
        email: validatedData.email,
        whatsapp: validatedData.whatsapp
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Erro de validação', message: '' };
    }
    console.error('Erro ao salvar lead:', error);
    return { success: false, error: 'Ocorreu um erro interno. Tente novamente mais tarde.', message: '' };
  }
}

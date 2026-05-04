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
    const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL || 'contato@fluxeer.com.br';
    
    const htmlBody = `
      <div style="font-family: sans-serif; padding: 30px; background: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a; margin-bottom: 24px; font-size: 20px;">🎉 Novo Lead da Landing Page</h2>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 20px;">
          <p style="margin: 0 0 12px;"><strong>Nome:</strong> ${validatedData.name}</p>
          <p style="margin: 0 0 12px;"><strong>Empresa:</strong> ${validatedData.company}</p>
          <p style="margin: 0 0 12px;"><strong>E-mail:</strong> ${validatedData.email}</p>
          <p style="margin: 0 0 12px;"><strong>WhatsApp:</strong> <a href="https://wa.me/${validatedData.whatsapp.replace(/\D/g, '')}" style="color: #00b0b3; text-decoration: none; font-weight: 600;">${validatedData.whatsapp}</a></p>
          <p style="margin: 0;"><strong>Volume Mensal:</strong> ${validatedData.monthlyVolume}</p>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Este lead solicitou uma demonstração através da Landing Page do Fluxeer.</p>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; text-align: center;">
          <a href="mailto:${validatedData.email}" style="display: inline-block; background: #00b0b3; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">Responder por E-mail</a>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: notificationEmail,
      from: getAuthEmailFrom(),
      subject: `🚨 [Fluxeer Lead] ${validatedData.company} - ${validatedData.name}`,
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

import { sendEmail } from './src/lib/messaging/email';

async function main() {
   console.log("-> TESTE DIRETO INICIADO");
   
   // Forçando o remetente oficial do sandbox do Resend
   process.env.RESEND_FROM_EMAIL = 'onboarding@resend.dev';

   const res = await sendEmail({
     to: 'jonattan.passos@gmail.com',
     subject: 'Seu E-mail Resend Funcionou!',
     html: `
       <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; text-align: center;">
         <h1 style="color: #4f46e5;">Sucesso Absoluto! 🚀</h1>
         <p>Se você recebeu isso, significa que a sua nova API Key da Resend está ativada e 100% pronta para envio!</p>
         <br/>
         <p style="font-size: 12px; color: #64748b;">(Teste enviado pelo Antigravity diretamente do seu VSCode via localhost)</p>
       </div>
     `
   });

   console.log("-> RESULTADO RESEND:", res);
}

main().catch(console.error);

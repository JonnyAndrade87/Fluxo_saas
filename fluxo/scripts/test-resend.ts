import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
async function test() {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@fluxeer.com.br',
    to: 'jonattan.passos@gmail.com',
    subject: 'Testando Resend Fluxeer',
    html: '<p>Teste</p>',
  });
  console.log({data, error});
}
test();

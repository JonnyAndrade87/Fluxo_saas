import { sendEmail } from './src/lib/messaging/email';

async function main() {
   process.env.RESEND_FROM_EMAIL = 'onboarding@resend.dev';
   const res = await sendEmail({
     to: 'jonattan.passos@gmail.com',
     subject: 'Test from CLI fixing domain',
     html: '<p>Testing Resend API Limits with Resend Dev Onboarding</p>'
   });
   console.log("RESULT WITH ONBOARDING@RESEND.DEV:", res);
}
main();

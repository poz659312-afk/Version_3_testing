require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
console.log('Using RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT FOUND');

if (!apiKey) {
  console.error('RESEND_API_KEY is missing in .env.local');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function sendTestEmail() {
  const targetEmail = process.argv[2] || 'poz659312@gmail.com';
  console.log(`Attempting to send email to: ${targetEmail}`);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Chameleon Team <onboarding@chameleon-nu.tech>',
      to: [targetEmail],
      subject: 'Chameleon Test Email from Verified Domain',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #09090b; color: #ffffff; border-radius: 12px;">
          <h1 style="color: #22c55e;">Chameleon Domain Verified Test</h1>
          <p>This email was sent using your verified domain: <strong>chameleon-nu.tech</strong>!</p>
          <p style="font-size: 12px; color: #a1a1aa;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
    } else {
      console.log('✅ Email sent successfully! Message ID:', data.id);
    }
  } catch (err) {
    console.error('❌ Unexpected execution error:', err);
  }
}

sendTestEmail();

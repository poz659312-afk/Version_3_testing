import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, otp, name } = await request.json()

    console.log('Send OTP API called:', { email, otpLength: otp?.length, name })

    if (!email || !otp) {
      console.error('Missing email or OTP')
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { 
          success: true,
          message: 'OTP generated (email service not configured)',
          otp,
          email 
        },
        { status: 200 }
      )
    }

    // Resolve base URL for email image assets
    const host = request.headers.get('host') || 'chameleon-nu.vercel.app'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = host.includes('localhost') ? `${protocol}://${host}` : 'https://chameleon-nu.vercel.app'
    const displayName = name ? name.trim() : 'Learner'

    // Split OTP into bulletproof table cells for email client compatibility
    const otpDigitsHtml = otp.split('').map((digit: string, index: number) => {
      const isLast = index === otp.length - 1;
      return `
        <td width="46" height="56" align="center" valign="middle" style="background-color: #121214; border: 2px solid #fbbf24; border-radius: 12px; font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; color: #fbbf24; text-align: center;">
          ${digit}
        </td>
        ${isLast ? '' : '<td width="8"></td>'}
      `;
    }).join('');

    // Custom email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - Chameleon</title>
  <link href="https://fonts.googleapis.com/css2?family=Rock+Salt&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #030303; color: #f4f4f5; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030303; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        
        <!-- Outer Card Wrapper -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #09090b; border: 1px solid #27272a; border-radius: 24px; overflow: hidden;">
          
          <!-- Top Decorative Gold Bar -->
          <tr>
            <td height="6" style="background-color: #fbbf24;"></td>
          </tr>
          
          <!-- Header Logo / Brand Name -->
          <tr>
            <td align="center" style="padding: 35px 40px 15px 40px;">
              <div style="font-size: 22px; font-weight: 700; color: #fbbf24; font-family: 'Rock Salt', 'Trebuchet MS', Arial, sans-serif; letter-spacing: 1px;">Chameleon</div>
              <div style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 3px; margin-top: 8px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;">Future of Learning</div>
            </td>
          </tr>
          
          <!-- Main Content Body -->
          <tr>
            <td style="padding: 20px 35px 40px 35px;">
              
              <!-- Mascot Image -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <img src="${baseUrl}/images/chameleon/02_chameleon_waving.png" alt="Chameleon Mascot" width="180" style="display: block; border: 0; outline: none; text-decoration: none;" />
                  </td>
                </tr>
              </table>
              
              <!-- Greetings & Intro -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; text-align: center;">
                <tr>
                  <td align="center">
                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 10px 0;">Welcome, ${displayName}! 👋</h2>
                    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0; max-width: 400px;">
                      We're thrilled to have you here. To activate your account and start learning, please verify your email address.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- OTP Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 20px; padding: 25px 20px; text-align: center;">
                      <span style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 18px;">Verification Code</span>
                      
                      <!-- OTP Digit Cells Table -->
                      <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                        <tr>
                          ${otpDigitsHtml}
                        </tr>
                      </table>
                      
                      <div style="font-size: 12px; color: #71717a; margin-top: 16px; font-weight: 500;">Valid for 10 minutes. Do not share this code.</div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Quick Instructions Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 20px;">
                      <p style="color: #fbbf24; margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">🔒 Simple Verification steps:</p>
                      <ol style="color: #a1a1aa; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; font-weight: 500;">
                        <li>Keep this window open and return to the signup screen.</li>
                        <li>Enter the 6 digits shown above into the verification input.</li>
                        <li>Complete your profile setup.</li>
                      </ol>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Safety note -->
              <p style="color: #52525b; font-size: 12px; line-height: 1.6; text-align: center; margin: 25px 0 0 0;">
                If you did not initiate this request, you can safely ignore this email.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer section -->
          <tr>
            <td align="center" style="padding: 25px 35px; background-color: #050507; border-top: 1px solid #18181b;">
              <p style="color: #71717a; font-size: 12px; margin: 0 0 6px 0;">
                Brought to you by the <strong style="color: #fbbf24;">Chameleon Team</strong>
              </p>
              <p style="color: #52525b; font-size: 11px; margin: 0 0 14px 0;">
                © 2026 Chameleon Educational Platform. All rights reserved.
              </p>
              <div>
                <a href="https://chameleon-nu.vercel.app" style="color: #a1a1aa; text-decoration: none; font-size: 12px; margin: 0 8px; font-weight: 600;">Website</a>
                <span style="color: #27272a;">•</span>
                <a href="https://chameleon-nu.vercel.app/privacy" style="color: #a1a1aa; text-decoration: none; font-size: 12px; margin: 0 8px; font-weight: 600;">Privacy</a>
                <span style="color: #27272a;">•</span>
                <a href="https://chameleon-nu.vercel.app/terms" style="color: #a1a1aa; text-decoration: none; font-size: 12px; margin: 0 8px; font-weight: 600;">Terms</a>
              </div>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`

    // Send email using Resend
    console.log('Attempting to send email via Resend...')
    const { data, error } = await resend.emails.send({
      from: 'Chameleon Team <noreply@chameleon-nu.tech>',
      to: [email],
      subject: `${otp} is your Chameleon verification code`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to send OTP email',
          details: error
        },
        { status: 500 }
      )
    }

    console.log('OTP Email sent successfully! ID:', data?.id)
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      id: data?.id
    })
  } catch (error) {
    console.error('Send OTP route error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending verification code' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic';

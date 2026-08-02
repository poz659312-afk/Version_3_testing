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
          otp, // Return OTP for development
          email 
        },
        { status: 200 }
      )
    }

    // Resolve host dynamically for image URLs
    const host = request.headers.get('host') || 'chameleon-nu.vercel.app'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    const displayName = name ? name.trim() : 'Learner'

    // Split OTP into styled character blocks
    const otpDigitsHtml = otp.split('').map((digit: string, index: number) => {
      const isLast = index === otp.length - 1;
      return `<span class="otp-digit" style="display: inline-block; width: 42px; height: 52px; line-height: 52px; text-align: center; background: #121214; border: 1.5px solid #fbbf24; border-radius: 12px; font-family: monospace; font-size: 26px; font-weight: 800; color: #fbbf24; ${isLast ? '' : 'margin-right: 6px;'} box-shadow: 0 4px 20px rgba(251, 191, 36, 0.2); text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);">${digit}</span>`;
    }).join('');

    // Custom email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - Chameleon</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', 'Rubik', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    @media only screen and (max-width: 600px) {
      .responsive-table {
        width: 100% !important;
      }
      .otp-digit {
        width: 34px !important;
        height: 44px !important;
        line-height: 44px !important;
        font-size: 20px !important;
        margin-right: 4px !important;
      }
      .main-padding {
        padding: 30px 20px !important;
      }
      .chameleon-img {
        width: 170px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030303; color: #f4f4f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030303; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        
        <!-- Outer Card Wrapper -->
        <table class="responsive-table" border="0" cellpadding="0" cellspacing="0" width="560" style="background: #09090b; border: 1px solid #1c1c1f; border-radius: 28px; box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8); overflow: hidden;">
          
          <!-- Top Decorative Glow bar -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);"></td>
          </tr>
          
          <!-- Header Logo / Brand Name -->
          <tr>
            <td align="center" style="padding: 35px 40px 15px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; font-weight: 800; letter-spacing: 4px; background: linear-gradient(to right, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #fbbf24; font-family: 'Plus Jakarta Sans', sans-serif;">CHAMELEON</span>
                    <div style="font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 4px; margin-top: 5px; font-weight: 700;">Future of Learning</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Body -->
          <tr>
            <td class="main-padding" style="padding: 25px 40px 40px 40px;">
              
              <!-- Creative Hero Image: Large Waving Chameleon without bounding borders -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; position: relative;">
                      <!-- Radial glow background behind the chameleon (no border) -->
                      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 240px; height: 240px; background: radial-gradient(circle, rgba(251, 191, 36, 0.14) 0%, transparent 70%); pointer-events: none;"></div>
                      
                      <!-- Transparent Waving Chameleon Image (Large and Borderless) -->
                      <img class="chameleon-img" src="${baseUrl}/images/chameleon/02_chameleon_waving.png" alt="Welcome to Chameleon" width="210" style="position: relative; z-index: 2; display: block; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5)); border: none; outline: none; text-decoration: none;" />
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Greetings & Welcome Intro -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px; text-align: center;">
                <tr>
                  <td align="center">
                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 12px 0; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.5px;">Welcome, ${displayName}! 👋</h2>
                    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0; max-width: 420px;">
                      We're thrilled to have you here. To activate your account and start your educational journey, please verify your email address.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- OTP Box (Creative Glass Box with individual glowing code slots) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 25px 20px; max-width: 400px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);">
                      <span style="color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 18px;">Verification Code</span>
                      
                      <!-- OTP Slots -->
                      <div style="white-space: nowrap; text-align: center; margin-bottom: 6px;">
                        ${otpDigitsHtml}
                      </div>
                      
                      <div style="font-size: 11px; color: #52525b; margin-top: 14px; font-weight: 500;">Valid for 10 minutes. Do not share this code.</div>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Quick Instructions Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="background: rgba(251, 191, 36, 0.02); border: 1px dashed rgba(251, 191, 36, 0.15); border-radius: 16px; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif;">
                      <p style="color: #ffffff; margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">🔒 Simple Verification steps:</p>
                      <ol style="color: #a1a1aa; margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.8; font-weight: 500;">
                        <li>Keep this window open and go to the Chameleon signup screen.</li>
                        <li>Enter the 6 digits shown above in the input fields.</li>
                        <li>Proceed to configure and personalize your profile.</li>
                      </ol>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Safety note -->
              <p style="color: #3f3f46; font-size: 12px; line-height: 1.6; text-align: center; margin: 30px 0 0 0;">
                If you did not initiate this sign-up request, you can safely ignore this message. Your email address remains secure.
              </p>
              
            </td>
          </tr>
          
          <!-- Separation border -->
          <tr>
            <td height="1" style="background-color: #1c1c1f;"></td>
          </tr>
          
          <!-- Footer section -->
          <tr>
            <td align="center" style="padding: 30px 40px; background-color: #050507;">
              <p style="color: #71717a; font-size: 12px; margin: 0 0 6px 0; font-weight: 500;">
                Brought to you by the <strong style="color: #fbbf24;">Chameleon Team</strong>
              </p>
              <p style="color: #3f3f46; font-size: 11px; margin: 0 0 18px 0;">
                © 2026 Chameleon Educational Platform. All rights reserved.
              </p>
              <div>
                <a href="https://chameleon-nu.vercel.app" style="color: #a1a1aa; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 600;">Website</a>
                <span style="color: #1c1c1f;">•</span>
                <a href="https://chameleon-nu.vercel.app/privacy" style="color: #a1a1aa; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 600;">Privacy</a>
                <span style="color: #1c1c1f;">•</span>
                <a href="https://chameleon-nu.vercel.app/terms" style="color: #a1a1aa; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 600;">Terms</a>
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
      from: 'Chameleon Team <noreply@chameleon-nu.vercel.app>',
      to: [email], // Send to user's email
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

    console.log('✅ OTP email sent successfully:', { email, messageId: data?.id })

    return NextResponse.json(
      { 
        success: true,
        message: 'OTP sent successfully',
        messageId: data?.id
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send OTP',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic';

import nodemailer from 'nodemailer'

// Configure based on environment
// In production, use a real SMTP service (SendGrid, AWS SES, etc.)
// In development, uses ethereal.email for testing
const createTransporter = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Development: create test account
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

interface SendMagicLinkParams {
  to: string
  name?: string
  studyName: string
  magicLink: string
}

export async function sendMagicLinkEmail({
  to,
  name,
  studyName,
  magicLink,
}: SendMagicLinkParams): Promise<{ success: boolean; previewUrl?: string }> {
  try {
    const transporter = await createTransporter()

    const greeting = name ? `Hello ${name},` : 'Hello,'

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Delphi Study" <noreply@boreallogic.ca>',
      to,
      subject: `Access Link: ${studyName}`,
      text: `
${greeting}

You've been invited to participate in a Delphi study: "${studyName}"

Click the link below to access the study. This link is valid for 24 hours:

${magicLink}

If you didn't request this link, you can safely ignore this email.

---
Yukon Women's Coalition GBV Indicators Project
Powered by Boreal Logic Inc.
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f3f4f6; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
    <h1 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">
      Delphi Study Access
    </h1>
    <p style="margin: 0; color: #4b5563;">
      ${studyName}
    </p>
  </div>
  
  <p style="margin: 0 0 16px 0;">
    ${greeting}
  </p>
  
  <p style="margin: 0 0 24px 0;">
    You've been invited to participate in a Delphi study for the GBV Indicators Framework.
    Click the button below to access the study.
  </p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${magicLink}" 
       style="display: inline-block; background: #1e3a5f; color: white; 
              padding: 14px 32px; text-decoration: none; border-radius: 6px;
              font-weight: 500; font-size: 16px;">
      Access Study
    </a>
  </div>
  
  <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280;">
    This link is valid for 24 hours. If you didn't request this link, you can safely ignore this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
  
  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
    Yukon Women's Coalition GBV Indicators Project<br>
    Powered by Boreal Logic Inc.
  </p>
</body>
</html>
      `.trim(),
    })

    // In development, get preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined

    if (previewUrl) {
      console.log('📧 Preview email at:', previewUrl)
    }

    return { success: true, previewUrl: previewUrl as string | undefined }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false }
  }
}

export async function sendRoundOpenEmail({
  to,
  name,
  studyName,
  roundNumber,
  deadline,
  magicLink,
}: {
  to: string
  name?: string
  studyName: string
  roundNumber: number
  deadline: Date
  magicLink: string
}): Promise<{ success: boolean }> {
  try {
    const transporter = await createTransporter()
    const greeting = name ? `Hello ${name},` : 'Hello,'

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Delphi Study" <noreply@boreallogic.ca>',
      to,
      subject: `Round ${roundNumber} Now Open: ${studyName}`,
      text: `
${greeting}

Round ${roundNumber} of the Delphi study "${studyName}" is now open.

${roundNumber > 1 ? 'You can now see how your responses compare to the group and revise if you wish.' : 'Please complete your assessment of the indicators.'}

Deadline: ${deadline.toLocaleDateString('en-CA', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Access the study: ${magicLink}

---
Yukon Women's Coalition GBV Indicators Project
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dbeafe; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 20px; color: #1e40af;">
      Round ${roundNumber} is Now Open
    </h1>
  </div>
  
  <p>${greeting}</p>
  
  <p>
    ${roundNumber > 1 
      ? 'The next round is ready. You can now see how your responses compare to the group and revise if you wish.' 
      : 'Please complete your assessment of the indicators for the GBV framework.'}
  </p>
  
  <p style="background: #fef3c7; padding: 12px; border-radius: 4px;">
    <strong>Deadline:</strong> ${deadline.toLocaleDateString('en-CA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
  </p>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${magicLink}" 
       style="display: inline-block; background: #1e3a5f; color: white; 
              padding: 14px 32px; text-decoration: none; border-radius: 6px;">
      Continue to Study
    </a>
  </div>
</body>
</html>
      `.trim(),
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false }
  }
}

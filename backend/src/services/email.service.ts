import nodemailer from 'nodemailer'
import { env }    from '../config/env'
import { logger } from '../config/logger'

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html })
    logger.info('Email sent', { to, subject })
  } catch (err: unknown) {
    logger.error('Email send failed', { to, subject, err: (err as Error).message })
    // Don't throw — email failure should not break the main flow
  }
}

// ─── Email templates ──────────────────────────────────────────

const baseStyle = `
  font-family: 'DM Sans', Arial, sans-serif;
  background: #F0F4FF;
  padding: 32px 16px;
  color: #0A0F1E;
`
const card = (content: string) => `
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;
       padding:40px 32px;box-shadow:0 4px 20px rgba(10,15,30,0.08)">
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-flex;align-items:center;justify-content:center;
           width:44px;height:44px;background:linear-gradient(135deg,#2D5BE3,#4F78F1);
           border-radius:12px;margin-bottom:8px">
        <span style="color:#fff;font-size:20px">⚡</span>
      </div>
      <h2 style="margin:0;font-size:22px;font-weight:800;color:#0A0F1E;font-family:'Plus Jakarta Sans',sans-serif">
        ${env.APP_NAME}
      </h2>
    </div>
    ${content}
    <hr style="border:none;border-top:1px solid #E2E8F8;margin:28px 0"/>
    <p style="text-align:center;color:#8492B4;font-size:13px;margin:0">
      © ${new Date().getFullYear()} ${env.APP_NAME} · Nigeria 🇳🇬
    </p>
  </div>
`

export const emailService = {

  async sendOtp(to: string, name: string, otp: string, purpose: string): Promise<void> {
    const purposeLabel: Record<string, string> = {
      EMAIL_VERIFY:    'verify your email address',
      PHONE_VERIFY:    'verify your phone number',
      RESET_PASSWORD:  'reset your password',
      TRANSACTION:     'confirm your transaction',
    }
    const label = purposeLabel[purpose] || 'continue'

    await sendMail(
      to,
      `Your ${env.APP_NAME} OTP: ${otp}`,
      `<div style="${baseStyle}">${card(`
        <h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0A0F1E">
          Hi ${name} 👋
        </h3>
        <p style="color:#4A5578;margin:0 0 24px;line-height:1.6">
          Use the code below to ${label}. It expires in <strong>5 minutes</strong>.
        </p>
        <div style="background:#EEF2FF;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2D5BE3;
                       font-family:'JetBrains Mono',monospace">
            ${otp}
          </span>
        </div>
        <p style="color:#8492B4;font-size:13px;margin:0;text-align:center">
          If you didn't request this, please ignore this email.
        </p>
      `)}</div>`
    )
  },

  async sendWelcome(to: string, name: string): Promise<void> {
    await sendMail(
      to,
      `Welcome to ${env.APP_NAME} 🎉`,
      `<div style="${baseStyle}">${card(`
        <h3 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0A0F1E">
          Welcome aboard, ${name}! 🎉
        </h3>
        <p style="color:#4A5578;margin:0 0 20px;line-height:1.6">
          Your ${env.APP_NAME} account is ready. You can now buy data, airtime, pay electricity bills,
          cable TV subscriptions and more — all in seconds.
        </p>
        <div style="background:#ECFDF5;border-radius:12px;padding:16px;margin-bottom:20px">
          <p style="margin:0;color:#047857;font-weight:600;font-size:14px">
            🎁 First-timer tip: Try <strong>Smart Buy</strong> — enter your budget and we'll
            find your best data deal across all networks automatically.
          </p>
        </div>
        <a href="${env.FRONTEND_URL}/dashboard"
           style="display:inline-block;background:#2D5BE3;color:#fff;padding:14px 28px;
                  border-radius:50px;text-decoration:none;font-weight:700;font-size:15px">
          Go to Dashboard →
        </a>
      `)}</div>`
    )
  },

  async sendTransactionReceipt(
    to: string,
    name: string,
    details: {
      type:      string
      amount:    string
      reference: string
      phone?:    string
      token?:    string
      status:    string
    }
  ): Promise<void> {
    const isSuccess = details.status === 'SUCCESS'
    const statusColor = isSuccess ? '#059669' : '#DC2626'
    const statusBg    = isSuccess ? '#ECFDF5' : '#FEF2F2'
    const statusLabel = isSuccess ? '✅ Successful' : '❌ Failed'

    await sendMail(
      to,
      `${env.APP_NAME} Transaction Receipt — ${details.reference}`,
      `<div style="${baseStyle}">${card(`
        <h3 style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0A0F1E">
          Transaction Receipt
        </h3>
        <div style="background:${statusBg};border-radius:10px;padding:10px 14px;margin-bottom:20px">
          <span style="color:${statusColor};font-weight:700;font-size:14px">${statusLabel}</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          ${[
            ['Service',    details.type],
            ['Amount',     details.amount],
            ['Reference',  details.reference],
            details.phone ? ['Phone', details.phone] : null,
            details.token ? ['Token / PIN', details.token] : null,
          ]
            .filter(Boolean)
            .map(([k, v]) => `
              <tr>
                <td style="padding:8px 0;color:#8492B4;font-size:14px;width:40%">${k}</td>
                <td style="padding:8px 0;color:#0A0F1E;font-weight:600;font-size:14px">${v}</td>
              </tr>
              <tr><td colspan="2"><div style="border-bottom:1px solid #E2E8F8"></div></td></tr>
            `)
            .join('')}
        </table>
        <p style="color:#8492B4;font-size:13px;margin-top:20px;text-align:center">
          Questions? Chat with us on
          <a href="https://wa.me/${env.APP_NAME}" style="color:#2D5BE3">WhatsApp</a>
          or email support@salnaj.ng
        </p>
      `)}</div>`
    )
  },

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
    await sendMail(
      to,
      `Reset your ${env.APP_NAME} password`,
      `<div style="${baseStyle}">${card(`
        <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0A0F1E">
          Password Reset Request
        </h3>
        <p style="color:#4A5578;margin:0 0 24px;line-height:1.6">
          Hi ${name}, we received a request to reset your password.
          Click the button below — this link expires in <strong>30 minutes</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2D5BE3;color:#fff;padding:14px 28px;
                  border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:20px">
          Reset Password →
        </a>
        <p style="color:#8492B4;font-size:13px;margin:0">
          If you didn't request a password reset, ignore this email.
          Your password won't change.
        </p>
      `)}</div>`
    )
  },
}

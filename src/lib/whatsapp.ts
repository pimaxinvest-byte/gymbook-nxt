import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken  = process.env.TWILIO_AUTH_TOKEN
const from       = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!accountSid || !authToken) {
    console.warn('[WhatsApp] Twilio credentials not configured — skipping notification')
    return
  }

  // Normalize: accept bare +34... or whatsapp:+34...
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

  const client = twilio(accountSid, authToken)
  await client.messages.create({ from, to: toFormatted, body: message })
}

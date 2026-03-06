/**
 * Test Resend Email API
 */

import { config } from 'dotenv'
import { Resend } from 'resend'

// Load environment variables
config()

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  console.log('📧 Testing Resend Email API...\n')

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: ['ismatsamadov@gmail.com'], // Change to your email
      subject: 'Test Email - Randevu Reservation System',
      html: `
        <h1>Email Service Test</h1>
        <p>This is a test email from your Randevu reservation system.</p>
        <p>If you're receiving this, your Resend API is configured correctly!</p>
        <hr />
        <p><small>Sent from Randevu</small></p>
      `
    })

    if (error) {
      console.error('❌ Email send failed:', error)
      return
    }

    console.log('✅ Email sent successfully!')
    console.log('   Email ID:', data?.id)
    console.log('   From:', process.env.EMAIL_FROM)
    console.log('\n📬 Check your inbox!\n')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testEmail()

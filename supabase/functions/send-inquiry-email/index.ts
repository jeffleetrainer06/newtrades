import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { inquiry, vehicle } = await req.json()
    
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY2')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY2 not found in environment variables')
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Email content
    const emailSubject = `New Vehicle Inquiry - ${vehicle.year} ${vehicle.make} ${vehicle.model} (Stock #${vehicle.stock_number})`
    
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">New Customer Inquiry</h2>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Vehicle Details</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Vehicle:</strong> ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}</li>
          <li><strong>Stock Number:</strong> ${vehicle.stock_number}</li>
          <li><strong>Price:</strong> $${vehicle.price ? vehicle.price.toLocaleString() : 'Not specified'}</li>
          <li><strong>Mileage:</strong> ${vehicle.mileage ? vehicle.mileage.toLocaleString() : 'Not specified'} miles</li>
          <li><strong>Color:</strong> ${vehicle.exterior_color || 'Not specified'}</li>
        </ul>
      </div>

      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Customer Information</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Name:</strong> ${inquiry.customer_name}</li>
          <li><strong>Email:</strong> <a href="mailto:${inquiry.customer_email}">${inquiry.customer_email}</a></li>
          <li><strong>Phone:</strong> ${inquiry.customer_phone ? `<a href="tel:${inquiry.customer_phone}">${inquiry.customer_phone}</a>` : 'Not provided'}</li>
        </ul>
      </div>

      ${inquiry.message ? `
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Customer Message</h3>
        <p style="margin: 0; white-space: pre-wrap;">${inquiry.message}</p>
      </div>
      ` : ''}

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">Next Steps</h3>
        <ul style="color: #92400e;">
          <li>Contact the customer to schedule a test drive</li>
          <li>Explain the reservation process (no deposit required)</li>
          <li>Discuss the reconditioning timeline</li>
          <li>Answer any questions about the vehicle</li>
        </ul>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        This inquiry was submitted on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
        <em>Pedersen Toyota Pre-Owned Vehicle System</em>
      </p>
    </div>
    `

    console.log('Sending email via Resend to: jlee@pedersentoyota.com')
    console.log('Subject:', emailSubject)

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vehicle Inquiries <onboarding@resend.dev>',
        to: ['jlee@pedersentoyota.com'],
        subject: emailSubject,
        html: emailHtml
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', result)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Email sent successfully via Resend:', result)

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification sent', emailId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email notification', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

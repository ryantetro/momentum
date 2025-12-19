export function getContractSignedEmailTemplate(
  clientName: string,
  bookingId: string,
  serviceType: string,
  eventDate: string
) {
  return {
    subject: `Momentum Alert: Contract Signed for ${clientName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Contract Signed Notification</h2>
        <p>Great news! A contract has been signed for one of your bookings.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Service Type:</strong> ${serviceType}</p>
          <p><strong>Event Date:</strong> ${eventDate}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
        <p>You can view the booking details in your Momentum dashboard.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Momentum.
        </p>
      </div>
    `,
    text: `
Contract Signed Notification

Great news! A contract has been signed for one of your bookings.

Client: ${clientName}
Service Type: ${serviceType}
Event Date: ${eventDate}
Booking ID: ${bookingId}

You can view the booking details in your Momentum dashboard.

This is an automated notification from Momentum.
    `,
  }
}

export function getPaymentReceivedEmailTemplate(
  clientName: string,
  bookingId: string,
  amount: number,
  milestoneName: string
) {
  return {
    subject: `Momentum Alert: Payment Received from ${clientName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Received Notification</h2>
        <p>Great news! You've received a payment for one of your bookings.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Milestone:</strong> ${milestoneName}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
        <p>You can view the booking details in your Momentum dashboard.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated notification from Momentum.
        </p>
      </div>
    `,
    text: `
Payment Received Notification

Great news! You've received a payment for one of your bookings.

Client: ${clientName}
Amount: $${amount.toFixed(2)}
Milestone: ${milestoneName}
Booking ID: ${bookingId}

You can view the booking details in your Momentum dashboard.

This is an automated notification from Momentum.
    `,
  }
}

export function getPaymentReminderEmailTemplate(
  clientName: string,
  photographerName: string,
  bookingId: string,
  amount: number,
  dueDate: string,
  portalUrl: string
) {
  return {
    subject: `Payment Reminder: ${amount.toFixed(2)} Due Soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        <p>Hi ${clientName},</p>
        <p>This is a friendly reminder that you have a payment due soon for your booking with ${photographerName}.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Pay Now
          </a>
        </div>
        <p>You can also view your booking details and make a payment through your client portal.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated reminder from Momentum. If you have any questions, please contact ${photographerName} directly.
        </p>
      </div>
    `,
    text: `
Payment Reminder

Hi ${clientName},

This is a friendly reminder that you have a payment due soon for your booking with ${photographerName}.

Amount Due: $${amount.toFixed(2)}
Due Date: ${dueDate}
Booking ID: ${bookingId}

Pay now: ${portalUrl}

You can also view your booking details and make a payment through your client portal.

This is an automated reminder from Momentum. If you have any questions, please contact ${photographerName} directly.
    `,
  }
}

export function getInquiryConfirmationEmailTemplate(
  clientName: string,
  photographerName: string,
  photographerStudio: string | null,
  eventType: string,
  eventDate: string,
  portfolioLink?: string | null,
  instagramLink?: string | null
) {
  const portfolioUrl = portfolioLink || instagramLink || null
  const eventDateFormatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return {
    subject: `We've received your inquiry! — ${photographerName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">Thank You!</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">Hi ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
          Thank you so much for reaching out about your <strong>${eventType}</strong> on <strong>${eventDateFormatted}</strong>!
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
          I've received your details and am currently reviewing my availability and the vision you shared for your shoot. You can expect to hear back from me within <strong>24-48 hours</strong> with the next steps.
        </p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px; color: #4a4a4a;"><strong>What happens next?</strong></p>
          <p style="margin: 10px 0 0 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
            If I'm available on your date, I'll send over a custom proposal link. From that link, you'll be able to review the contract and handle the booking deposit all in one place.
          </p>
        </div>
        
        ${portfolioUrl ? `
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
          In the meantime, feel free to check out my latest work here:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portfolioUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
            View My Portfolio
          </a>
        </div>
        ` : ''}
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-top: 30px;">
          Excited to potentially work with you!
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-top: 20px;">
          Best,<br>
          <strong>${photographerName}</strong><br>
          ${photographerStudio ? `<span style="color: #666;">${photographerStudio}</span>` : ''}
        </p>
        
        <div style="border-top: 1px solid #e5e5e5; margin-top: 40px; padding-top: 20px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            This email was sent via Momentum. If you have any questions, please reply directly to this email.
          </p>
        </div>
      </div>
    `,
    text: `
Thank You!

Hi ${clientName},

Thank you so much for reaching out about your ${eventType} on ${eventDateFormatted}!

I've received your details and am currently reviewing my availability and the vision you shared for your shoot. You can expect to hear back from me within 24-48 hours with the next steps.

What happens next? If I'm available on your date, I'll send over a custom proposal link. From that link, you'll be able to review the contract and handle the booking deposit all in one place.

${portfolioUrl ? `In the meantime, feel free to check out my latest work here: ${portfolioUrl}` : ''}

Excited to potentially work with you!

Best,
${photographerName}
${photographerStudio ? photographerStudio : ''}

---
This email was sent via Momentum. If you have any questions, please reply directly to this email.
    `,
  }
}

export function getProposalEmailTemplate(
  clientName: string,
  photographerName: string,
  photographerStudio: string | null,
  serviceType: string,
  eventDate: string,
  portalUrl: string,
  totalPrice: number,
  depositAmount: number
) {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const capitalizedServiceType =
    serviceType.charAt(0).toUpperCase() + serviceType.slice(1)

  return {
    subject: `Proposal & Contract for your ${capitalizedServiceType} with ${photographerName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">Your Proposal is Ready!</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">Hi ${clientName},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
          It was such a pleasure speaking with you about your <strong>${capitalizedServiceType}</strong>! I am so excited about the possibility of capturing these memories for you.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
          To make things as simple and secure as possible, I use Momentum to handle my bookings. I've created a private portal for you where you can review our agreement and handle the deposit in one place.
        </p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px; color: #4a4a4a;"><strong>What's inside the portal?</strong></p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 16px; color: #4a4a4a; line-height: 1.8;">
            <li><strong>The Contract:</strong> Review and e-sign our agreement digitally.</li>
            <li><strong>Payment Schedule:</strong> See the breakdown for your deposit and future milestones.</li>
            <li><strong>Secure Checkout:</strong> Pay your deposit via credit card to officially lock in your date.</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
            Review Proposal & Pay Deposit
          </a>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Booking Summary</p>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 16px; color: #4a4a4a;">Event Date:</span>
            <span style="font-size: 16px; font-weight: 600; color: #1a1a1a;">${eventDateFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 16px; color: #4a4a4a;">Total Price:</span>
            <span style="font-size: 16px; font-weight: 600; color: #1a1a1a;">$${totalPrice.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e5e5; margin-top: 8px;">
            <span style="font-size: 18px; font-weight: 600; color: #1a1a1a;">Deposit Due:</span>
            <span style="font-size: 18px; font-weight: 600; color: #007bff;">$${depositAmount.toLocaleString()}</span>
          </div>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
          Once the contract is signed and the deposit is processed, your date will be officially marked as <strong>Booked</strong> on my calendar, and we can get started on the fun stuff!
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-top: 30px;">
          If you have any questions at all, just hit reply.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-top: 20px;">
          Best,<br>
          <strong>${photographerName}</strong><br>
          ${photographerStudio ? `<span style="color: #666;">${photographerStudio}</span>` : ''}
        </p>
        
        <div style="border-top: 1px solid #e5e5e5; margin-top: 40px; padding-top: 20px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            This email was sent via Momentum. If you have any questions, please reply directly to this email.
          </p>
        </div>
      </div>
    `,
    text: `
Your Proposal is Ready!

Hi ${clientName},

It was such a pleasure speaking with you about your ${capitalizedServiceType}! I am so excited about the possibility of capturing these memories for you.

To make things as simple and secure as possible, I use Momentum to handle my bookings. I've created a private portal for you where you can review our agreement and handle the deposit in one place.

What's inside the portal?
- The Contract: Review and e-sign our agreement digitally.
- Payment Schedule: See the breakdown for your deposit and future milestones.
- Secure Checkout: Pay your deposit via credit card to officially lock in your date.

Review your proposal: ${portalUrl}

Booking Summary:
Event Date: ${eventDateFormatted}
Total Price: $${totalPrice.toLocaleString()}
Deposit Due: $${depositAmount.toLocaleString()}

Once the contract is signed and the deposit is processed, your date will be officially marked as Booked on my calendar, and we can get started on the fun stuff!

If you have any questions at all, just hit reply.

Best,
${photographerName}
${photographerStudio ? photographerStudio : ''}

---
This email was sent via Momentum. If you have any questions, please reply directly to this email.
    `,
  }
}

export function getPaymentConfirmedEmailTemplate(
  photographerName: string,
  clientName: string,
  amount: number,
  bookingId: string,
  serviceType: string,
  eventDate: string,
  bookingUrl: string
) {
  const eventDateFormatted = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const capitalizedServiceType =
    serviceType.charAt(0).toUpperCase() + serviceType.slice(1)

  return {
    subject: `🔥 Payment Received! $${amount.toFixed(2)} from ${clientName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 32px;">💰</span>
          </div>
          <h1 style="color: #1a1a1a; font-size: 32px; margin-bottom: 10px; font-weight: 700;">Great News!</h1>
        </div>
        
        <p style="font-size: 18px; line-height: 1.6; color: #4a4a4a; margin-bottom: 20px;">
          Hi ${photographerName},
        </p>
        
        <p style="font-size: 18px; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px;">
          <strong>${clientName}</strong> just signed their contract and paid their <strong>$${amount.toLocaleString()}</strong> deposit for the <strong>${capitalizedServiceType}</strong> on <strong>${eventDateFormatted}</strong>.
        </p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #10b981; padding: 24px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-size: 16px; color: #4a4a4a; font-weight: 600;">What happened:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 16px; color: #4a4a4a; line-height: 1.8;">
            <li><strong>Contract:</strong> Signed and stored in your dashboard</li>
            <li><strong>Payment:</strong> $${amount.toLocaleString()} is being processed via Stripe</li>
            <li><strong>Status:</strong> This booking is now officially <strong style="color: #10b981;">Active</strong></li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${bookingUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            View Booking Details
          </a>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; margin: 30px 0;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Booking Summary</p>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 16px; color: #4a4a4a;">Client:</span>
            <span style="font-size: 16px; font-weight: 600; color: #1a1a1a;">${clientName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 16px; color: #4a4a4a;">Service:</span>
            <span style="font-size: 16px; font-weight: 600; color: #1a1a1a;">${capitalizedServiceType}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 16px; color: #4a4a4a;">Event Date:</span>
            <span style="font-size: 16px; font-weight: 600; color: #1a1a1a;">${eventDateFormatted}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e5e5; margin-top: 8px;">
            <span style="font-size: 18px; font-weight: 600; color: #1a1a1a;">Amount Received:</span>
            <span style="font-size: 18px; font-weight: 600; color: #10b981;">$${amount.toLocaleString()}</span>
          </div>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-top: 30px;">
          Congratulations! Your booking is confirmed and the client is all set. You can manage this booking from your Momentum dashboard.
        </p>
        
        <div style="border-top: 1px solid #e5e5e5; margin-top: 40px; padding-top: 20px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            This email was sent via Momentum. If you have any questions, please contact support.
          </p>
        </div>
      </div>
    `,
    text: `
Great News!

Hi ${photographerName},

${clientName} just signed their contract and paid their $${amount.toLocaleString()} deposit for the ${capitalizedServiceType} on ${eventDateFormatted}.

What happened:
- Contract: Signed and stored in your dashboard
- Payment: $${amount.toLocaleString()} is being processed via Stripe
- Status: This booking is now officially Active

View Booking Details: ${bookingUrl}

Booking Summary:
Client: ${clientName}
Service: ${capitalizedServiceType}
Event Date: ${eventDateFormatted}
Amount Received: $${amount.toLocaleString()}

Congratulations! Your booking is confirmed and the client is all set. You can manage this booking from your Momentum dashboard.

---
This email was sent via Momentum. If you have any questions, please contact support.
    `,
  }
}

export function getFinalBalanceReminderEmailTemplate(
  clientName: string,
  studioName: string,
  serviceType: string,
  balanceAmount: number,
  portalUrl: string,
  logoUrl?: string | null
) {
  const capitalizedServiceType = serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
  const formattedAmount = balanceAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return {
    subject: `Complete Your Payment for Your ${capitalizedServiceType} Session`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        ${logoUrl ? `<div style="text-align: center; padding: 30px 0 20px 0;">
          <img src="${logoUrl}" alt="${studioName}" style="max-height: 60px; max-width: 200px;" />
        </div>` : ''}
        
        <div style="padding: 40px 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 600; margin: 0 0 20px 0; line-height: 1.3;">
            Hi ${clientName},
          </h1>
          
          <p style="font-size: 18px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0;">
            We loved capturing your special moments! Your gallery is almost ready for its debut.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            To complete your ${capitalizedServiceType} session and receive your final gallery, please complete your payment below.
          </p>
          
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Payment Summary</p>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-size: 16px; color: #475569;">Service:</span>
              <span style="font-size: 16px; font-weight: 600; color: #1e293b;">${capitalizedServiceType}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px;">
              <span style="font-size: 20px; font-weight: 600; color: #1e293b;">Remaining Balance:</span>
              <span style="font-size: 24px; font-weight: 700; color: #3b82f6;">$${formattedAmount}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${portalUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: transform 0.2s;">
              View & Complete Final Payment
            </a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-top: 30px; text-align: center;">
            Questions? Reply to this email or contact ${studioName} directly.
          </p>
          
          <div style="border-top: 1px solid #e5e5e5; margin-top: 40px; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Sent via Momentum — The premium workflow for photographers
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Hi ${clientName},

We loved capturing your special moments! Your gallery is almost ready for its debut.

To complete your ${capitalizedServiceType} session and receive your final gallery, please complete your payment.

Payment Summary:
Service: ${capitalizedServiceType}
Remaining Balance: $${formattedAmount}

Complete Your Payment: ${portalUrl}

Questions? Reply to this email or contact ${studioName} directly.

---
Sent via Momentum — The premium workflow for photographers
    `,
  }
}

export function getPaymentSuccessEmailTemplate(
  clientName: string,
  amountPaid: number,
  studioName: string,
  logoUrl?: string | null,
  socialLinks?: {
    instagram?: string
    website?: string
  }
) {
  const formattedAmount = amountPaid.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return {
    subject: `Payment Successful — Thank You, ${clientName}!`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        ${logoUrl ? `<div style="text-align: center; padding: 30px 0 20px 0;">
          <img src="${logoUrl}" alt="${studioName}" style="max-height: 60px; max-width: 200px;" />
        </div>` : ''}
        
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 40px; color: white;">✓</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">
              Payment Successful!
            </h1>
            <p style="font-size: 18px; color: #10b981; font-weight: 600; margin: 0;">
              Your payment of $${formattedAmount} has been received
            </p>
          </div>
          
          <p style="font-size: 18px; line-height: 1.6; color: #4a4a4a; margin: 0 0 20px 0; text-align: center;">
            Hi ${clientName},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin: 0 0 30px 0;">
            We are so excited to get your final gallery to you! Your payment was successfully processed, and we're now working on preparing your photos.
          </p>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 15px 0; font-size: 14px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Receipt</p>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #86efac;">
              <span style="font-size: 16px; color: #166534;">Amount Paid:</span>
              <span style="font-size: 18px; font-weight: 700; color: #166534;">$${formattedAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px;">
              <span style="font-size: 16px; color: #166534;">Remaining Balance:</span>
              <span style="font-size: 18px; font-weight: 700; color: #166534;">$0.00</span>
            </div>
          </div>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 6px;">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #1e293b;">What Happens Next?</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
              Expect your gallery within 2 weeks. We'll send you an email as soon as your photos are ready for download!
            </p>
          </div>
          
          ${socialLinks && (socialLinks.instagram || socialLinks.website) ? `
          <div style="text-align: center; margin: 40px 0; padding-top: 30px; border-top: 1px solid #e5e5e5;">
            <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Follow ${studioName}</p>
            <div style="display: flex; justify-content: center; gap: 15px;">
              ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Instagram</a>` : ''}
              ${socialLinks.website ? `<a href="${socialLinks.website}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">Website</a>` : ''}
            </div>
          </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e5e5e5; margin-top: 40px; padding-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              Thank you for choosing ${studioName}!<br />
              This receipt was sent via Momentum.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Payment Successful!

Hi ${clientName},

Your payment of $${formattedAmount} has been successfully processed.

Receipt:
Amount Paid: $${formattedAmount}
Remaining Balance: $0.00

What Happens Next?
Expect your gallery within 2 weeks. We'll send you an email as soon as your photos are ready for download!

${socialLinks && socialLinks.instagram ? `Follow us on Instagram: ${socialLinks.instagram}` : ''}
${socialLinks && socialLinks.website ? `Visit our website: ${socialLinks.website}` : ''}

Thank you for choosing ${studioName}!
This receipt was sent via Momentum.
    `,
  }
}


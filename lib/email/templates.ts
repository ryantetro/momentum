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


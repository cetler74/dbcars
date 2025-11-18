import axios from 'axios';

interface BookingEmailData {
  booking_number: string;
  pickup_date: string;
  dropoff_date: string;
  total_price: number;
  base_price: number;
  extras_price: number;
  discount_amount: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year?: number;
  pickup_location_name: string;
  dropoff_location_name: string;
}

interface BookingStatusEmailData extends BookingEmailData {
  status: string;
  payment_link?: string | null;
  notes?: string | null;
  pickup_location_city?: string;
  dropoff_location_city?: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Status-specific email content
function getStatusEmailContent(status: string): { subject: string; heading: string; message: string; statusColor: string } {
  const statusMap: Record<string, { subject: string; heading: string; message: string; statusColor: string }> = {
    pending: {
      subject: 'Booking Received',
      heading: 'Booking Pending Review',
      message: 'Your booking has been received and is being reviewed by our team. We will send you payment instructions shortly.',
      statusColor: '#f59e0b',
    },
    waiting_payment: {
      subject: 'Payment Required',
      heading: 'Payment Link Available',
      message: 'Your booking has been approved! Please complete the payment using the link below to confirm your reservation.',
      statusColor: '#3b82f6',
    },
    confirmed: {
      subject: 'Booking Confirmed',
      heading: 'Booking Confirmed',
      message: 'Great news! Your booking has been confirmed. We look forward to serving you.',
      statusColor: '#10b981',
    },
    cancelled: {
      subject: 'Booking Cancelled',
      heading: 'Booking Cancelled',
      message: 'Your booking has been cancelled. If you have any questions, please contact us.',
      statusColor: '#ef4444',
    },
    completed: {
      subject: 'Booking Completed',
      heading: 'Booking Completed',
      message: 'Thank you for choosing DB Luxury Cars! We hope you enjoyed your experience. We would love to hear your feedback.',
      statusColor: '#6366f1',
    },
  };

  return statusMap[status] || {
    subject: 'Booking Status Update',
    heading: 'Booking Status Updated',
    message: `Your booking status has been updated to: ${status}`,
    statusColor: '#6b7280',
  };
}

export async function sendBookingEmail(booking: BookingEmailData) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || process.env.BREVO_DEFAULT_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'DB Luxury Cars';
  const adminEmail = process.env.BREVO_ADMIN_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn(
      '[Brevo] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL. Skipping email send.'
    );
    return;
  }

  const commonHtml = `
    <h1>Booking Confirmation - ${booking.booking_number}</h1>
    <p>Dear ${booking.first_name} ${booking.last_name},</p>
    <p>Thank you for your booking with DB Luxury Cars. Here are your booking details:</p>
    <ul>
      <li><strong>Booking Number:</strong> ${booking.booking_number}</li>
      <li><strong>Vehicle:</strong> ${booking.make} ${booking.model}${
    booking.year ? ' (' + booking.year + ')' : ''
  }</li>
      <li><strong>Pickup Location:</strong> ${booking.pickup_location_name}</li>
      <li><strong>Dropoff Location:</strong> ${booking.dropoff_location_name}</li>
      <li><strong>Pickup Date:</strong> ${new Date(
        booking.pickup_date
      ).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</li>
      <li><strong>Dropoff Date:</strong> ${new Date(
        booking.dropoff_date
      ).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</li>
      <li><strong>Total Price:</strong> €${booking.total_price.toFixed(2)}</li>
    </ul>
    <p>If you have any questions or need to make changes, please contact us.</p>
    <p>Best regards,<br/>DB Luxury Cars</p>
  `;

  const customerPayload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: booking.email, name: `${booking.first_name} ${booking.last_name}` }],
    subject: `Your Booking Confirmation - ${booking.booking_number}`,
    htmlContent: commonHtml,
  };

  const adminPayload = adminEmail
    ? {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: adminEmail, name: 'DB Luxury Cars Admin' }],
        subject: `New Booking Received - ${booking.booking_number}`,
        htmlContent:
          `<p>A new booking has been created.</p>` +
          commonHtml +
          `<p><strong>Customer Phone:</strong> ${booking.phone}</p>`,
      }
    : null;

  try {
    await axios.post(BREVO_API_URL, customerPayload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });

    if (adminPayload) {
      await axios.post(BREVO_API_URL, adminPayload, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
    }

    console.log(
      '[Brevo] Booking confirmation email sent for booking:',
      booking.booking_number
    );
  } catch (error: any) {
    console.error('[Brevo] Failed to send booking email:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  }
}

export async function sendBookingStatusEmail(booking: BookingStatusEmailData) {
  console.log('[Brevo] sendBookingStatusEmail called with booking:', {
    booking_number: booking.booking_number,
    status: booking.status,
    email: booking.email,
    payment_link: booking.payment_link,
  });

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || process.env.BREVO_DEFAULT_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'DB Luxury Cars';
  const adminEmail = process.env.BREVO_ADMIN_EMAIL;

  console.log('[Brevo] Email config:', {
    hasApiKey: !!apiKey,
    hasSenderEmail: !!senderEmail,
    senderName,
    hasAdminEmail: !!adminEmail,
  });

  if (!apiKey || !senderEmail) {
    const error = new Error(
      `Missing BREVO configuration: ${!apiKey ? 'BREVO_API_KEY' : ''} ${!senderEmail ? 'BREVO_SENDER_EMAIL' : ''}`
    );
    console.error('[Brevo] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL. Cannot send status email.');
    console.error('[Brevo] Please configure BREVO_API_KEY and BREVO_SENDER_EMAIL in your .env file');
    throw error; // Throw error so it's caught by the caller
  }

  const statusContent = getStatusEmailContent(booking.status);

  // If payment link is present, customize the message to emphasize payment request
  let emailMessage = statusContent.message;
  let emailSubject = statusContent.subject;
  if (booking.payment_link) {
    if (booking.status === 'waiting_payment') {
      emailMessage = 'Your booking has been approved! Please complete the payment using the link below to confirm your reservation.';
      emailSubject = 'Payment Required - Action Needed';
    } else if (booking.status === 'pending') {
      emailMessage = 'Your booking has been reviewed and approved! Please complete the payment using the link below to proceed with your reservation.';
      emailSubject = 'Payment Required - Complete Your Booking';
    } else if (booking.status === 'confirmed') {
      // Even if confirmed, if payment link is present, it might be for additional payment
      emailMessage = 'Your booking is confirmed. Please complete the payment using the link below if payment is still pending.';
      emailSubject = 'Payment Link - Complete Your Booking';
    } else {
      emailMessage = 'Please complete the payment using the link below.';
      emailSubject = 'Payment Required';
    }
  }

  const pickupDate = new Date(booking.pickup_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const pickupTime = new Date(booking.pickup_date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const dropoffDate = new Date(booking.dropoff_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const dropoffTime = new Date(booking.dropoff_date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build payment link section if available - make it more prominent
  const paymentLinkHtml = booking.payment_link
    ? `
      <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <h2 style="margin-top: 0; color: #10b981; font-size: 24px;">💰 Payment Required</h2>
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Please complete your payment to secure your booking. Click the button below to proceed:</p>
        <a href="${booking.payment_link}" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 10px 0;">
          💳 Complete Payment Now
        </a>
        <p style="margin-top: 15px; font-size: 0.9em; color: #666;">Or copy and paste this link into your browser:<br><a href="${booking.payment_link}" style="color: #10b981; word-break: break-all;">${booking.payment_link}</a></p>
        <p style="margin-top: 15px; font-size: 0.85em; color: #888; font-style: italic;">Please complete payment as soon as possible to confirm your reservation.</p>
      </div>
    `
    : '';

  // Build notes section if available
  const notesHtml = booking.notes
    ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #f59e0b;">Additional Notes</h3>
        <p style="margin: 0;">${booking.notes}</p>
      </div>
    `
    : '';

  const customerHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: ${statusContent.statusColor};">${statusContent.heading}</h2>
        <p>Dear ${booking.first_name} ${booking.last_name},</p>
        <p>${emailMessage}</p>
        
        ${paymentLinkHtml}
        ${notesHtml}
        
        <h3>Booking Details:</h3>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Booking Number:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${booking.booking_number}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: ${statusContent.statusColor}; font-weight: bold; text-transform: capitalize;">${booking.status.replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Vehicle:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${booking.make} ${booking.model}${booking.year ? ' (' + booking.year + ')' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Pickup Location:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${booking.pickup_location_name}${booking.pickup_location_city ? ', ' + booking.pickup_location_city : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Pickup Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${pickupDate} ${pickupTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dropoff Location:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${booking.dropoff_location_name}${booking.dropoff_location_city ? ', ' + booking.dropoff_location_city : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dropoff Date:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${dropoffDate} ${dropoffTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Price:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">€${booking.total_price.toFixed(2)}</td>
          </tr>
        </table>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>DB Luxury Cars Team</p>
      </body>
    </html>
  `;

  const customerPayload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: booking.email, name: `${booking.first_name} ${booking.last_name}` }],
    subject: `${emailSubject} - ${booking.booking_number}`,
    htmlContent: customerHtml,
  };

  const adminPayload = adminEmail
    ? {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: adminEmail, name: 'DB Luxury Cars Admin' }],
        subject: `Booking Status Changed - ${booking.booking_number} (${booking.status})`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #f97316;">Booking Status Updated</h2>
              <p>Booking ${booking.booking_number} status has been updated:</p>
              
              <h3>Status: <span style="color: ${statusContent.statusColor}; text-transform: capitalize;">${booking.status.replace('_', ' ')}</span></h3>
              
              ${paymentLinkHtml}
              ${notesHtml}
              
              <h3>Booking Details:</h3>
              <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Booking Number:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${booking.booking_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Customer:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${booking.first_name} ${booking.last_name} (${booking.email})</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Vehicle:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${booking.make} ${booking.model}${booking.year ? ' (' + booking.year + ')' : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Pickup:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${booking.pickup_location_name} on ${pickupDate} ${pickupTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dropoff:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${booking.dropoff_location_name} on ${dropoffDate} ${dropoffTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Price:</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">€${booking.total_price.toFixed(2)}</td>
                </tr>
              </table>
            </body>
          </html>
        `,
      }
    : null;

  try {
    console.log('[Brevo] Sending customer email to:', booking.email);
    console.log('[Brevo] Email subject:', customerPayload.subject);
    console.log('[Brevo] Has payment link:', !!booking.payment_link);
    
    const customerResponse = await axios.post(BREVO_API_URL, customerPayload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });
    console.log('[Brevo] Customer email sent successfully. Response status:', customerResponse.status);

    if (adminPayload) {
      console.log('[Brevo] Sending admin email to:', adminEmail);
      const adminResponse = await axios.post(BREVO_API_URL, adminPayload, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
      console.log('[Brevo] Admin email sent successfully. Response status:', adminResponse.status);
    }

    console.log(
      '[Brevo] ✅ Booking status email sent successfully for booking:',
      booking.booking_number,
      'status:',
      booking.status,
      'to:',
      booking.email
    );
  } catch (error: any) {
    console.error('[Brevo] ❌ Failed to send booking status email:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      booking_number: booking.booking_number,
      customer_email: booking.email,
    });
    
    // Re-throw the error so caller knows it failed
    throw error;
  }
}

interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export async function sendContactEmail(contact: ContactEmailData) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || process.env.BREVO_DEFAULT_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'DB Luxury Cars';
  const adminEmail = process.env.BREVO_ADMIN_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn(
      '[Brevo] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL. Skipping contact email send.'
    );
    return;
  }

  const adminHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #f97316;">New Contact Form Submission</h2>
        <p>A new message has been received through the contact form:</p>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0;">
          <p><strong>Name:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">${contact.message}</p>
        </div>
        
        <p style="margin-top: 30px;">
          <a href="mailto:${contact.email}" style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reply to ${contact.name}
          </a>
        </p>
        
        <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
          This is an automated notification from the DB Luxury Cars contact form.
        </p>
      </body>
    </html>
  `;

  const customerHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #10b981;">Thank You for Contacting Us</h2>
        <p>Dear ${contact.name},</p>
        <p>Thank you for reaching out to DB Luxury Cars. We have received your message and will get back to you as soon as possible.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">${contact.message}</p>
        </div>
        
        <p>Our team typically responds within 24 hours. If your inquiry is urgent, please call us at <strong>+212 524 123456</strong>.</p>
        
        <p>Best regards,<br>DB Luxury Cars Team</p>
      </body>
    </html>
  `;

  const adminPayload = adminEmail
    ? {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: adminEmail, name: 'DB Luxury Cars Admin' }],
        subject: `New Contact Form Submission from ${contact.name}`,
        htmlContent: adminHtml,
      }
    : null;

  const customerPayload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: contact.email, name: contact.name }],
    subject: 'Thank You for Contacting DB Luxury Cars',
    htmlContent: customerHtml,
  };

  try {
    // Send to admin
    if (adminPayload) {
      await axios.post(BREVO_API_URL, adminPayload, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
      console.log('[Brevo] Contact form notification sent to admin');
    }

    // Send confirmation to customer
    await axios.post(BREVO_API_URL, customerPayload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });
    console.log('[Brevo] Contact form confirmation sent to customer:', contact.email);
  } catch (error: any) {
    console.error('[Brevo] Failed to send contact email:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}


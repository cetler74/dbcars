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
    console.warn(
      '[Brevo] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL. Skipping status email send.'
    );
    return;
  }

  const statusContent = getStatusEmailContent(booking.status);

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

  // Build payment link section if available
  const paymentLinkHtml = booking.payment_link
    ? `
      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #10b981;">Payment Link</h3>
        <p>Click the button below to complete your payment:</p>
        <a href="${booking.payment_link}" 
           style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
          Complete Payment
        </a>
        <p style="margin-top: 10px; font-size: 0.9em; color: #666;">Or copy this link: <a href="${booking.payment_link}">${booking.payment_link}</a></p>
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
        <p>${statusContent.message}</p>
        
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
    subject: `${statusContent.subject} - ${booking.booking_number}`,
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
    await axios.post(BREVO_API_URL, customerPayload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });
    console.log('[Brevo] Customer email sent successfully');

    if (adminPayload) {
      console.log('[Brevo] Sending admin email to:', adminEmail);
      await axios.post(BREVO_API_URL, adminPayload, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
      });
      console.log('[Brevo] Admin email sent successfully');
    }

    console.log(
      '[Brevo] Booking status email sent for booking:',
      booking.booking_number,
      'status:',
      booking.status
    );
  } catch (error: any) {
    console.error('[Brevo] Failed to send booking status email:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}


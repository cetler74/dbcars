import PDFDocument from 'pdfkit';
import { getCompanyInfo, getTaxRate } from '../config/company';

export interface BookingExtra {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  bookingNumber: string;
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  // Vehicle info
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: number;
  // Booking details
  pickupDate: Date;
  dropoffDate: Date;
  pickupLocation: string;
  dropoffLocation: string;
  // Pricing
  basePrice: number;
  extrasPrice: number;
  discountAmount: number;
  taxRate: number;
  totalPrice: number;
  // Extras
  extras?: BookingExtra[];
  couponCode?: string;
}

/**
 * Generate invoice PDF
 * @param data - Invoice data
 * @returns PDF buffer
 */
export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    // Collect PDF data
    doc.on('data', (chunk: Buffer) => {
      buffers.push(chunk);
    });
    
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    doc.on('error', (error: Error) => {
      reject(error);
    });

    const company = getCompanyInfo();
    const taxRate = getTaxRate();

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text(company.name, 50, 50);
    doc.fontSize(10).font('Helvetica').text('INVOICE', 50, 80);

    // Company info (left side)
    doc.fontSize(9).font('Helvetica');
    doc.text(`From:`, 50, 110);
    doc.font('Helvetica-Bold').text(company.name, 50, 125);
    doc.font('Helvetica');
    doc.text(company.address, 50, 140);
    doc.text(`${company.city}, ${company.country}`, 50, 155);
    doc.text(`Phone: ${company.phone}`, 50, 170);
    doc.text(`Email: ${company.email}`, 50, 185);
    if (company.taxNumber) {
      doc.text(`Tax ID: ${company.taxNumber}`, 50, 200);
    }
    if (company.vatNumber) {
      doc.text(`VAT: ${company.vatNumber}`, 50, 215);
    }

    // Invoice details (right side)
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Invoice #: ${data.invoiceNumber}`, 350, 110, { align: 'right' });
    doc.font('Helvetica');
    doc.text(`Date: ${formatDate(data.invoiceDate)}`, 350, 125, { align: 'right' });
    doc.text(`Booking #: ${data.bookingNumber}`, 350, 140, { align: 'right' });

    // Customer info
    doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 250);
    doc.fontSize(10).font('Helvetica');
    doc.text(data.customerName, 50, 270);
    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, 285);
    }
    if (data.customerCity) {
      doc.text(`${data.customerCity}${data.customerCountry ? ', ' + data.customerCountry : ''}`, 50, 300);
    }
    doc.text(`Email: ${data.customerEmail}`, 50, 315);
    doc.text(`Phone: ${data.customerPhone}`, 50, 330);

    // Booking details
    doc.fontSize(11).font('Helvetica-Bold').text('Booking Details:', 350, 250);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Vehicle: ${data.vehicleMake} ${data.vehicleModel}${data.vehicleYear ? ' (' + data.vehicleYear + ')' : ''}`, 350, 270);
    doc.text(`Pickup: ${formatDate(data.pickupDate)}`, 350, 285);
    doc.text(`${data.pickupLocation}`, 350, 300);
    doc.text(`Dropoff: ${formatDate(data.dropoffDate)}`, 350, 315);
    doc.text(`${data.dropoffLocation}`, 350, 330);

    // Line separator
    doc.moveTo(50, 360).lineTo(550, 360).stroke();

    // Items table header
    let yPos = 380;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, yPos, { width: 250 });
    doc.text('Quantity', 310, yPos, { width: 50, align: 'center' });
    doc.text('Price', 380, yPos, { width: 70, align: 'right' });
    doc.text('Total', 470, yPos, { width: 80, align: 'right' });

    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();

    // Base rental
    yPos += 15;
    doc.font('Helvetica');
    doc.text('Vehicle Rental', 50, yPos, { width: 250 });
    doc.text('1', 310, yPos, { width: 50, align: 'center' });
    doc.text(formatCurrency(data.basePrice), 380, yPos, { width: 70, align: 'right' });
    doc.text(formatCurrency(data.basePrice), 470, yPos, { width: 80, align: 'right' });

    // Extras
    if (data.extras && data.extras.length > 0) {
      yPos += 20;
      doc.font('Helvetica-Bold').text('Extras:', 50, yPos);
      yPos += 15;
      doc.font('Helvetica');
      for (const extra of data.extras) {
        const extraTotal = extra.price * extra.quantity;
        doc.text(extra.name, 60, yPos, { width: 240 });
        doc.text(extra.quantity.toString(), 310, yPos, { width: 50, align: 'center' });
        doc.text(formatCurrency(extra.price), 380, yPos, { width: 70, align: 'right' });
        doc.text(formatCurrency(extraTotal), 470, yPos, { width: 80, align: 'right' });
        yPos += 15;
      }
    }

    // Discount
    if (data.discountAmount > 0) {
      yPos += 10;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 15;
      doc.font('Helvetica');
      doc.text(`Discount${data.couponCode ? ` (${data.couponCode})` : ''}`, 50, yPos);
      doc.text(formatCurrency(-data.discountAmount), 470, yPos, { width: 80, align: 'right' });
    }

    // Tax
    const subtotal = data.basePrice + data.extrasPrice - data.discountAmount;
    const taxAmount = subtotal * (data.taxRate / 100);
    
    if (data.taxRate > 0) {
      yPos += 20;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 15;
      doc.text(`Subtotal`, 380, yPos, { width: 70, align: 'right' });
      doc.text(formatCurrency(subtotal), 470, yPos, { width: 80, align: 'right' });
      yPos += 15;
      doc.text(`Tax (${data.taxRate}%)`, 380, yPos, { width: 70, align: 'right' });
      doc.text(formatCurrency(taxAmount), 470, yPos, { width: 80, align: 'right' });
    }

    // Total
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
    yPos += 15;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total', 380, yPos, { width: 70, align: 'right' });
    doc.text(formatCurrency(data.totalPrice), 470, yPos, { width: 80, align: 'right' });

    // Footer
    yPos += 40;
    doc.fontSize(9).font('Helvetica');
    doc.text('Thank you for your business!', 50, yPos);
    yPos += 15;
    doc.text('If you have any questions about this invoice, please contact us.', 50, yPos);

    // Finalize PDF - this triggers the 'end' event
    doc.end();
  });
}

/**
 * Format date for invoice
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency for invoice
 */
function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`;
}


import pool from '../config/database';
import { generateInvoicePDF, InvoiceData } from './invoice';
import { saveInvoicePDF, deleteInvoicePDF, isInvoicePDFValid } from './invoiceStorage';

export interface InvoiceRecord {
  id: string;
  booking_id: string;
  invoice_number: string;
  invoice_date: Date;
  file_path: string;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Generate invoice number using database function
 */
async function generateInvoiceNumber(): Promise<string> {
  const result = await pool.query('SELECT generate_invoice_number() as invoice_number');
  return result.rows[0].invoice_number;
}

/**
 * Create invoice for a booking
 * @param bookingId - The booking ID
 * @param invoiceData - Invoice data for PDF generation
 * @param forceRegenerate - If true, delete existing invoice and regenerate (default: false)
 * @returns Created invoice record
 */
export async function createInvoice(
  bookingId: string,
  invoiceData: InvoiceData,
  forceRegenerate: boolean = false
): Promise<InvoiceRecord> {
  // Check if invoice already exists for this booking
  const existingInvoice = await getInvoiceByBookingId(bookingId);
  if (existingInvoice) {
    if (forceRegenerate) {
      // Delete existing invoice (both database record and file)
      await pool.query('DELETE FROM invoices WHERE id = $1', [existingInvoice.id]);
      deleteInvoicePDF(existingInvoice.file_path);
      console.log('[Invoice] Deleted existing invoice for regeneration:', existingInvoice.invoice_number);
    } else {
      throw new Error('Invoice already exists for this booking');
    }
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Generate PDF (async)
  const pdfBuffer = await generateInvoicePDF({
    ...invoiceData,
    invoiceNumber,
    invoiceDate: new Date(),
  });

  // Save PDF to filesystem
  const filePath = saveInvoicePDF(invoiceNumber, pdfBuffer);

  // Create invoice record in database
  const result = await pool.query(
    `INSERT INTO invoices (booking_id, invoice_number, invoice_date, file_path)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [bookingId, invoiceNumber, new Date(), filePath]
  );

  return result.rows[0];
}

/**
 * Get invoice by booking ID
 * @param bookingId - The booking ID
 * @returns Invoice record or null
 */
export async function getInvoiceByBookingId(
  bookingId: string
): Promise<InvoiceRecord | null> {
  const result = await pool.query(
    'SELECT * FROM invoices WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
    [bookingId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get invoice by invoice number
 * @param invoiceNumber - The invoice number
 * @returns Invoice record or null
 */
export async function getInvoiceByInvoiceNumber(
  invoiceNumber: string
): Promise<InvoiceRecord | null> {
  const result = await pool.query(
    'SELECT * FROM invoices WHERE invoice_number = $1',
    [invoiceNumber]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get invoice by ID
 * @param invoiceId - The invoice ID
 * @returns Invoice record or null
 */
export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceRecord | null> {
  const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Mark invoice as sent
 * @param invoiceId - The invoice ID
 */
export async function markInvoiceAsSent(invoiceId: string): Promise<void> {
  await pool.query(
    'UPDATE invoices SET sent_at = CURRENT_TIMESTAMP WHERE id = $1',
    [invoiceId]
  );
}

/**
 * Get all invoices with pagination
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 20)
 * @returns Object with invoices and pagination info
 */
export async function getAllInvoices(
  page: number = 1,
  perPage: number = 20
): Promise<{ invoices: InvoiceRecord[]; total: number; page: number; perPage: number }> {
  const offset = (page - 1) * perPage;

  // Get total count
  const countResult = await pool.query('SELECT COUNT(*) as total FROM invoices');
  const total = parseInt(countResult.rows[0].total);

  // Get invoices
  const result = await pool.query(
    `SELECT * FROM invoices 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [perPage, offset]
  );

  return {
    invoices: result.rows,
    total,
    page,
    perPage,
  };
}

/**
 * Regenerate invoice for a booking (deletes old and creates new)
 * @param bookingId - The booking ID
 * @param invoiceData - Invoice data for PDF generation
 * @returns Created invoice record
 */
export async function regenerateInvoice(
  bookingId: string,
  invoiceData: InvoiceData
): Promise<InvoiceRecord> {
  return createInvoice(bookingId, invoiceData, true);
}

/**
 * Check if invoice PDF is valid (not empty)
 * @param invoiceId - The invoice ID
 * @returns True if PDF exists and has content
 */
export async function isInvoiceValid(invoiceId: string): Promise<boolean> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    return false;
  }
  return isInvoicePDFValid(invoice.file_path);
}


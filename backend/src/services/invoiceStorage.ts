import fs from 'fs';
import path from 'path';

// Invoice storage directory
const invoicesDir = path.join(__dirname, '../../uploads/invoices');

// Ensure invoices directory exists
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Save invoice PDF to filesystem
 * @param invoiceNumber - The invoice number (e.g., INV-2025-0001)
 * @param pdfBuffer - The PDF file buffer
 * @returns The file path relative to uploads directory
 */
export function saveInvoicePDF(invoiceNumber: string, pdfBuffer: Buffer): string {
  const timestamp = Date.now();
  const filename = `${invoiceNumber}-${timestamp}.pdf`;
  const filePath = path.join(invoicesDir, filename);
  
  // Write PDF to file
  fs.writeFileSync(filePath, pdfBuffer);
  
  // Return relative path for database storage
  return `/uploads/invoices/${filename}`;
}

/**
 * Get invoice PDF file path
 * @param filePath - The relative file path from database
 * @returns The absolute file path
 */
export function getInvoicePDFPath(filePath: string): string {
  // If path already includes uploads, use it directly
  if (filePath.startsWith('/uploads/')) {
    return path.join(__dirname, '../..', filePath);
  }
  // Otherwise assume it's relative to invoices directory
  return path.join(invoicesDir, filePath);
}

/**
 * Read invoice PDF file
 * @param filePath - The relative file path from database
 * @returns The PDF file buffer or null if file doesn't exist
 */
export function getInvoicePDF(filePath: string): Buffer | null {
  try {
    const absolutePath = getInvoicePDFPath(filePath);
    if (fs.existsSync(absolutePath)) {
      return fs.readFileSync(absolutePath);
    }
    return null;
  } catch (error) {
    console.error('Error reading invoice PDF:', error);
    return null;
  }
}

/**
 * Delete invoice PDF file
 * @param filePath - The relative file path from database
 * @returns True if file was deleted, false otherwise
 */
export function deleteInvoicePDF(filePath: string): boolean {
  try {
    const absolutePath = getInvoicePDFPath(filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting invoice PDF:', error);
    return false;
  }
}

/**
 * Check if invoice PDF is valid (exists and has content)
 * @param filePath - The relative file path from database
 * @returns True if PDF exists and has content (> 0 bytes)
 */
export function isInvoicePDFValid(filePath: string): boolean {
  try {
    const absolutePath = getInvoicePDFPath(filePath);
    if (fs.existsSync(absolutePath)) {
      const stats = fs.statSync(absolutePath);
      return stats.size > 0;
    }
    return false;
  } catch (error) {
    console.error('Error checking invoice PDF:', error);
    return false;
  }
}


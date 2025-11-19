// Company information configuration for invoices
// These values can be overridden by environment variables

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  taxNumber?: string;
  vatNumber?: string;
  logoPath?: string;
}

export const getCompanyInfo = (): CompanyInfo => {
  return {
    name: process.env.COMPANY_NAME || 'DB Luxury Cars',
    address: process.env.COMPANY_ADDRESS || '123 Luxury Street',
    city: process.env.COMPANY_CITY || 'Casablanca',
    country: process.env.COMPANY_COUNTRY || 'Morocco',
    phone: process.env.COMPANY_PHONE || '+212 524 123456',
    email: process.env.COMPANY_EMAIL || 'info@dbluxurycars.com',
    taxNumber: process.env.COMPANY_TAX_NUMBER,
    vatNumber: process.env.COMPANY_VAT_NUMBER,
    logoPath: process.env.COMPANY_LOGO_PATH,
  };
};

// Tax rate configuration (can be 0% or configurable)
export const getTaxRate = (): number => {
  const taxRate = process.env.INVOICE_TAX_RATE;
  if (taxRate) {
    const rate = parseFloat(taxRate);
    return isNaN(rate) ? 0 : rate;
  }
  return 0; // Default to 0% tax
};


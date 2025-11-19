# Invoice Configuration Guide

## Company Information Configuration

The invoice feature uses company information from environment variables. These are configured in the **`backend/.env`** file.

### Location

**File:** `backend/.env`

If this file doesn't exist, create it in the `backend` directory.

### Required/Optional Variables

Add the following variables to your `backend/.env` file:

```bash
# Company Information (for invoices)
COMPANY_NAME=DB Luxury Cars
COMPANY_ADDRESS=123 Luxury Street
COMPANY_CITY=Casablanca
COMPANY_COUNTRY=Morocco
COMPANY_PHONE=+212 524 123456
COMPANY_EMAIL=info@dbluxurycars.com

# Optional: Tax/VAT Information
COMPANY_TAX_NUMBER=TAX123456789
COMPANY_VAT_NUMBER=VAT123456789

# Optional: Invoice Tax Rate (percentage, default: 0%)
INVOICE_TAX_RATE=0

# Optional: Company Logo Path (relative to backend/uploads/)
COMPANY_LOGO_PATH=/uploads/logo.png
```

### Default Values

If you don't configure these variables, the system will use these defaults:

- **COMPANY_NAME**: `DB Luxury Cars`
- **COMPANY_ADDRESS**: `123 Luxury Street`
- **COMPANY_CITY**: `Casablanca`
- **COMPANY_COUNTRY**: `Morocco`
- **COMPANY_PHONE**: `+212 524 123456`
- **COMPANY_EMAIL**: `info@dbluxurycars.com`
- **INVOICE_TAX_RATE**: `0` (0% tax)

### How It Works

The configuration is read from `backend/src/config/company.ts`, which:
1. Reads environment variables from `process.env`
2. Falls back to default values if variables are not set
3. Is used when generating invoice PDFs

### Example `.env` File

Here's a complete example of what your `backend/.env` file might look like:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dbcars_db
DB_USER=carloslarramba
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000

# Brevo Email Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@dbluxcars.com
BREVO_SENDER_NAME=DB Luxury Cars
BREVO_ADMIN_EMAIL=admin@dbluxcars.com

# Company Information (for invoices)
COMPANY_NAME=DB Luxury Cars
COMPANY_ADDRESS=123 Luxury Street
COMPANY_CITY=Casablanca
COMPANY_COUNTRY=Morocco
COMPANY_PHONE=+212 524 123456
COMPANY_EMAIL=info@dbluxurycars.com
COMPANY_TAX_NUMBER=TAX123456789
COMPANY_VAT_NUMBER=VAT123456789
INVOICE_TAX_RATE=0
```

### After Configuration

1. **Restart your backend server** for changes to take effect:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test the configuration** by generating an invoice:
   - Go to Admin > Bookings
   - Confirm a booking
   - Check the generated invoice PDF to see your company information

### Notes

- The `.env` file is gitignored and won't be committed to version control
- All company information variables are optional - defaults will be used if not set
- Tax rate should be a number (e.g., `20` for 20%, `0` for 0%)
- Logo path is optional and should be relative to the `backend/uploads/` directory


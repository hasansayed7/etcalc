export const APP_CONSTANTS = {
  SALUTATIONS: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
  BILLING_CYCLES: ['monthly', 'annual'],
  MIN_QUANTITY: 1,
  DEFAULT_SERVICE_CHARGE: 50,
  STRIPE_FEE_PERCENTAGE: 0.029, // 2.9%
  STRIPE_FIXED_FEE: 0.30, // $0.30
  PDF_OPTIONS: {
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    fontSize: 12,
    margins: {
      top: 40,
      bottom: 60,
      left: 40,
      right: 40
    }
  },
  TABLE_HEADERS: [
    { header: 'Product', dataKey: 'name' },
    { header: 'License', dataKey: 'license' },
    { header: 'Quantity', dataKey: 'qty' },
    { header: 'Unit Price', dataKey: 'unitPrice' },
    { header: 'Total', dataKey: 'total' }
  ],
  ERROR_MESSAGES: {
    INVALID_QUANTITY: 'Quantity must be a positive integer',
    INVALID_SERVICE_CHARGE: 'Service charge must be a non-negative number',
    INVALID_CUSTOMER_NAME: 'Customer name is required',
    PRODUCT_NOT_FOUND: 'Selected product not found',
    PDF_GENERATION_ERROR: 'Error generating PDF. Please try again.'
  }
}; 
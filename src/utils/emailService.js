import emailjs from '@emailjs/browser';
import { 
  getLoyaltyTier, 
  getUpsellOpportunities, 
  getProfitOptimizationRecommendations,
  generateFeeReport,
  calculateFeeSavings,
  getRecommendations,
  calculateTotalCost,
  formatCurrency,
  FINANCIAL_CONSTANTS
} from './pricing';

// Initialize EmailJS with your public key
const initEmailJS = () => {
  try {
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('EmailJS public key is not configured');
    }
    emailjs.init(publicKey);
    console.log('EmailJS initialized successfully');
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
    throw error;
  }
};

// Initialize EmailJS
initEmailJS();

// Public URL for the ExcelyTech logo
const EXCELYTECH_LOGO = 'https://excelytech.com/wp-content/uploads/2025/01/excelytech-logo.png';

/**
 * Email template styles
 */
const EMAIL_STYLES = `
<style>
    body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
    .header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
    }
    .logo {
        max-width: 200px;
        height: auto;
        margin-bottom: 15px;
    }
    .section {
        margin: 20px 0;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #fff;
    }
    .section-title {
        background-color: #f5f5f5;
        padding: 10px;
        margin: -15px -15px 15px -15px;
        border-radius: 5px 5px 0 0;
        font-weight: bold;
        color: #2c3e50;
    }
    .cost-breakdown {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
    }
    .cost-breakdown td {
        padding: 8px;
        border-bottom: 1px solid #ddd;
    }
    .cost-breakdown .total {
        font-weight: bold;
        border-top: 2px solid #333;
    }
    .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 0.9em;
        color: #666;
    }
    .company-name {
        font-size: 24px;
        font-weight: bold;
        color: #2c3e50;
        margin: 10px 0;
    }
    .highlight {
        background-color: #fff3cd;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
    }
    .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 0;
    }
    .recommendation {
        background-color: #e8f4f8;
        padding: 15px;
        border-radius: 5px;
        margin: 10px 0;
    }
</style>
`;

/**
 * Generate HTML email template
 * @param {Object} data - Email data
 * @returns {string} HTML email template
 */
const generateEmailTemplate = (data) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid email data');
    }

    const title = data.title || 'ExcelyTech Communication';
    const content = data.content || '';

    if (!content) {
      throw new Error('Email content is required');
    }

    // Replace any stray logo <img> tags in content with the correct EXCELYTECH_LOGO
    const safeContent = content.replace(/<img[^>]*src=["'][^"']*excelytech[^"']*["'][^>]*alt=["']ExcelyTech Logo["'][^>]*>/gi,
      `<img src="${EXCELYTECH_LOGO}" alt="ExcelyTech Logo" class="logo">`
    );

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${EMAIL_STYLES}
</head>
<body>
    <div class="header">
        <img src="${EXCELYTECH_LOGO}" alt="ExcelyTech Logo" class="logo">
    </div>

    ${safeContent}

    <div class="footer">
        <p>Best regards,<br>ExcelyTech Team</p>
        <p>Email: support@excelytech.com<br>Phone: +1 (555) 123-4567</p>
    </div>
</body>
</html>
    `;
  } catch (error) {
    console.error('Error generating email template:', error);
    throw error;
  }
};

/**
 * Send an email using EmailJS
 * @param {Object} data - The email data
 * @param {string} data.to_email - Recipient's email address
 * @param {string} data.subject - Email subject
 * @param {string} data.title - Email title
 * @param {string} data.content - Email content
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendEmail = async (data) => {
  try {
    console.log('sendEmail called with data:', JSON.stringify(data, null, 2));

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid email data');
    }

    if (!data.to_email) {
      throw new Error('Recipient email is required');
    }

    if (!data.subject) {
      throw new Error('Email subject is required');
    }

    // Check for either message or content
    const emailContent = data.content || data.message;
    if (!emailContent) {
      console.error('Missing content in data:', data);
      throw new Error('Email content is required');
    }

    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;

    if (!serviceId || !templateId) {
      throw new Error('EmailJS service ID or template ID is not configured');
    }

    // Generate the full HTML template
    const fullHtmlContent = generateEmailTemplate({
      ...data,
      content: emailContent
    });

    console.log('Generated HTML content length:', fullHtmlContent.length);
    console.log('HTML content preview:', fullHtmlContent.substring(0, 200) + '...');

    const templateParams = {
      to_email: data.to_email,
      subject: data.subject,
      message: fullHtmlContent,  // Use the full HTML content directly
      is_html: true
    };

    console.log('Sending email with template params:', JSON.stringify({
      ...templateParams,
      message: templateParams.message.substring(0, 200) + '...' // Log preview of message
    }, null, 2));

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send quotation email
 * @param {Object} data - Quotation data
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendQuotation = async (data) => {
  try {
    console.log('sendQuotation called with data:', JSON.stringify(data, null, 2));

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid quotation data');
    }

    const requiredFields = ['to_email', 'customerName', 'companyName', 'products', 'commitmentLevel', 'isAnnual', 'monthlyVolume', 'totalSpend'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const quotationDate = new Date().toLocaleDateString();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    const quotationRef = `ETQ-${Date.now().toString().slice(-6)}`;

    console.log('Generating total cost...');
    const totalCost = calculateTotalCost(
      data.products,
      data.products.reduce((sum, p) => sum + p.quantity, 0),
      data.isAnnual,
      false,
      data.monthlyVolume,
      data.totalSpend
    );
    console.log('Total cost calculated:', totalCost);

    console.log('Getting loyalty tier...');
    const loyaltyTier = getLoyaltyTier(data.totalSpend);
    console.log('Loyalty tier:', loyaltyTier);

    console.log('Generating fee report...');
    const feeReport = generateFeeReport(
      { amount: totalCost.total },
      data.monthlyVolume,
      data.totalSpend
    );
    console.log('Fee report:', feeReport);

    console.log('Getting upsell opportunities...');
    const upsellOpportunities = getUpsellOpportunities(
      data.products,
      data.commitmentLevel,
      data.totalSpend
    );
    console.log('Upsell opportunities:', upsellOpportunities);

    console.log('Generating email content...');
    const content = `
      <p>Dear ${data.customerName},</p>
      <p>Thank you for choosing ExcelyTech. We are pleased to present our comprehensive solution for ${data.companyName}.</p>

      <div class="section">
          <div class="section-title">QUOTATION DETAILS</div>
          <p>Quotation Date: ${quotationDate}<br>
          Valid Until: ${validUntil.toLocaleDateString()}<br>
          Quotation Reference: ${quotationRef}<br>
          Commitment Level: ${data.commitmentLevel}<br>
          Billing Cycle: ${data.isAnnual ? 'Annual' : 'Monthly'}</p>
      </div>

      <div class="section">
          <div class="section-title">CUSTOMER INFORMATION</div>
          <p>Company: ${data.companyName}<br>
          Loyalty Tier: ${loyaltyTier.name}<br>
          Monthly Volume: ${formatCurrency(data.monthlyVolume)}<br>
          Total Spend: ${formatCurrency(data.totalSpend)}</p>
      </div>

      <div class="section">
          <div class="section-title">PRODUCTS & SERVICES</div>
          ${data.products.map(p => `
          <div style="margin-bottom: 15px;">
              <strong>${p.name}</strong><br>
              - Quantity: ${p.quantity}<br>
              - Unit Price: ${formatCurrency(p.unitPrice)}<br>
              - Subtotal: ${formatCurrency(p.unitPrice * p.quantity)}<br>
              - Features: ${p.features ? p.features.join(', ') : 'Standard features included'}
          </div>
          `).join('')}
      </div>

      <div class="section">
          <div class="section-title">COST BREAKDOWN</div>
          <table class="cost-breakdown">
              <tr>
                  <td>Subtotal:</td>
                  <td style="text-align: right;">${formatCurrency(totalCost.subtotal)}</td>
              </tr>
              <tr>
                  <td>Processing Fees:</td>
                  <td style="text-align: right;">${formatCurrency(totalCost.processingFees)}</td>
              </tr>
              <tr>
                  <td>Service Fees:</td>
                  <td style="text-align: right;">${formatCurrency(feeReport.serviceFee)}</td>
              </tr>
              <tr>
                  <td>Volume Discount:</td>
                  <td style="text-align: right;">${formatCurrency(totalCost.volumeDiscount)}</td>
              </tr>
              <tr>
                  <td>Commitment Discount:</td>
                  <td style="text-align: right;">${formatCurrency(totalCost.commitmentDiscount)}</td>
              </tr>
              <tr>
                  <td>Tax (${(FINANCIAL_CONSTANTS.TAX_RATE * 100).toFixed(1)}%):</td>
                  <td style="text-align: right;">${formatCurrency(totalCost.tax)}</td>
              </tr>
              <tr class="total">
                  <td>Total Amount:</td>
                  <td style="text-align: right;">${formatCurrency(totalCost.total)}</td>
              </tr>
          </table>
      </div>

      <div class="section">
          <div class="section-title">RECOMMENDED ADD-ONS</div>
          ${upsellOpportunities.map(opp => `
          <div class="recommendation">
              <strong>${opp.name}</strong><br>
              - Price: ${formatCurrency(opp.price)}<br>
              - Description: ${opp.description}<br>
              - Benefits: ${opp.benefits.join(', ')}
          </div>
          `).join('')}
      </div>

      <div class="section">
          <div class="section-title">NEXT STEPS</div>
          <p>1. Review the quotation<br>
          2. Sign and return the acceptance form<br>
          3. Our team will contact you to schedule implementation<br>
          4. Begin your ExcelyTech journey!</p>
          <a href="#" class="button">Accept Quotation</a>
      </div>
    `;

    console.log('Generated content length:', content.length);
    console.log('Content preview:', content.substring(0, 200) + '...');

    const emailData = {
      to_email: data.to_email,
      subject: `ExcelyTech Quotation - ${data.companyName} - ${quotationRef}`,
      title: 'OFFICIAL QUOTATION',
      content
    };

    console.log('Sending email with data:', JSON.stringify(emailData, null, 2));

    return await sendEmail(emailData);
  } catch (error) {
    console.error('Error sending quotation:', error);
    throw error;
  }
};

/**
 * Send pricing recommendations email
 * @param {Object} data - Customer and pricing data
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendPricingRecommendations = async (data) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid pricing recommendations data');
    }

    const requiredFields = ['to_email', 'customerName', 'products', 'totalSpend', 'monthlyVolume', 'commitmentLevel'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const loyaltyTier = getLoyaltyTier(data.totalSpend);
    const upsellOpportunities = getUpsellOpportunities(
      data.products,
      data.commitmentLevel,
      data.totalSpend
    );
    const profitRecommendations = getProfitOptimizationRecommendations(
      data.products,
      data.commitmentLevel,
      data.totalSpend
    );
    const feeReport = generateFeeReport(
      { amount: data.totalSpend },
      data.monthlyVolume,
      data.totalSpend
    );
    const feeSavings = calculateFeeSavings(
      { amount: data.totalSpend },
      data.monthlyVolume,
      data.totalSpend
    );
    const recommendations = getRecommendations(
      data.products,
      feeReport.serviceFee,
      data.commitmentLevel,
      feeReport.profitBeforeTax,
      data.totalSpend,
      data.monthlyVolume
    );

    const content = `
      <p>Dear ${data.customerName},</p>
      <p>We've analyzed your account and have some personalized recommendations to help you optimize your costs and maximize benefits:</p>

      <div class="section">
          <div class="section-title">CURRENT STATUS</div>
          <p>Loyalty Tier: ${loyaltyTier.name}<br>
          Total Spend: ${formatCurrency(data.totalSpend)}<br>
          Monthly Volume: ${formatCurrency(data.monthlyVolume)}</p>
      </div>

      <div class="section">
          <div class="section-title">FEE ANALYSIS</div>
          <div class="highlight">${feeReport.summary}</div>
      </div>

      <div class="section">
          <div class="section-title">POTENTIAL SAVINGS</div>
          <div class="highlight">${feeSavings.summary}</div>
      </div>

      <div class="section">
          <div class="section-title">RECOMMENDED ACTIONS</div>
          ${recommendations.map(rec => `<p>- ${rec}</p>`).join('')}
      </div>

      <div class="section">
          <div class="section-title">UPSELL OPPORTUNITIES</div>
          ${upsellOpportunities.map(opp => `
          <div class="recommendation">
              <strong>${opp.name}</strong><br>
              ${opp.description}
          </div>
          `).join('')}
      </div>

      <div class="section">
          <div class="section-title">PROFIT OPTIMIZATION</div>
          ${profitRecommendations.map(rec => `<p>- ${rec}</p>`).join('')}
      </div>

      <div class="section">
          <p>Would you like to discuss any of these recommendations in detail? Our team is ready to help you implement these optimizations.</p>
          <a href="#" class="button">Schedule a Call</a>
      </div>
    `;

    return await sendEmail({
      to_email: data.to_email,
      subject: `Personalized Pricing Recommendations for ${data.customerName}`,
      title: 'PRICING OPTIMIZATION RECOMMENDATIONS',
      content
    });
  } catch (error) {
    console.error('Error sending pricing recommendations:', error);
    throw error;
  }
};

/**
 * Send commitment optimization email
 * @param {Object} data - Customer and commitment data
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendCommitmentOptimization = async (data) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid commitment optimization data');
    }

    const requiredFields = ['to_email', 'customerName', 'currentCommitment', 'recommendedCommitment', 'savings'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const content = `
      <p>Dear ${data.customerName},</p>
      <p>We've identified an opportunity to optimize your commitment level and increase your savings:</p>

      <div class="section">
          <div class="section-title">COMMITMENT COMPARISON</div>
          <p>Current Commitment: ${data.currentCommitment}<br>
          Recommended Commitment: ${data.recommendedCommitment}</p>
      </div>

      <div class="section">
          <div class="section-title">POTENTIAL BENEFITS</div>
          <div class="highlight">
              <p>- Annual Savings: ${formatCurrency(data.savings.annual)}<br>
              - Processing Fee Savings: ${formatCurrency(data.savings.processingFees)}<br>
              - Service Fee Savings: ${formatCurrency(data.savings.serviceFees)}<br>
              - Additional Benefits: ${data.savings.additionalBenefits.join(', ')}</p>
          </div>
      </div>

      <div class="section">
          <p>Would you like to discuss upgrading your commitment level? Our team is available to help you make this transition smoothly.</p>
          <a href="#" class="button">Upgrade Now</a>
      </div>
    `;

    return await sendEmail({
      to_email: data.to_email,
      subject: `Commitment Optimization Opportunity for ${data.customerName}`,
      title: 'COMMITMENT OPTIMIZATION',
      content
    });
  } catch (error) {
    console.error('Error sending commitment optimization:', error);
    throw error;
  }
};

export async function imageToDataUrl(imagePath) {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
} 
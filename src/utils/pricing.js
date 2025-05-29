// Constants for financial calculations
export const FINANCIAL_CONSTANTS = {
  ANNUAL_DISCOUNT_RATE: 0.03,
  INDUSTRY_AVG_SERVICE_FEE: 100,
  SERVICE_FEE_THRESHOLD_LOW: 0.8,
  SERVICE_FEE_THRESHOLD_HIGH: 1.2,
  TAX_RATE: 0.13,
  DEFAULT_MARGIN: 0.35
};

/**
 * Get pricing data for a product based on quantity
 * @param {Object} product - Product object
 * @param {number} qty - Quantity
 * @returns {Object} Pricing slab data
 * @throws {Error} If product or quantity is invalid
 */
export const getPricingData = (product, qty) => {
  if (!product || !product.pricingSlabs) {
    throw new Error('Invalid product data');
  }
  
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error('Quantity must be a positive integer');
  }

  const slab = product.pricingSlabs.find(
    slab => qty >= slab.minQty && qty <= slab.maxQty
  );

  return slab || product.pricingSlabs[product.pricingSlabs.length - 1];
};

/**
 * Get package name based on number of products
 * @param {Array} products - Array of products
 * @returns {string} Package name
 */
export const getPackageName = (products) => {
  if (!Array.isArray(products)) {
    throw new Error('Invalid products array');
  }
  return products.length >= 2 ? "Backup Total" : "Backup Basic";
};

/**
 * Calculate total cost with proper decimal handling
 * @param {number} amount - Amount to format
 * @returns {number} Formatted amount with 2 decimal places
 */
export const formatCurrency = (amount) => {
  return Number(Math.round(amount + 'e2') + 'e-2');
};

/**
 * Get business recommendations based on current configuration
 * @param {Array} products - Array of selected products
 * @param {number} serviceCharge - Service charge amount
 * @param {string} billingCycle - Billing cycle (monthly/annual)
 * @param {number} profitBeforeTax - Profit before tax
 * @returns {Array} Array of recommendations
 */
export const getRecommendations = (products, serviceCharge, billingCycle, profitBeforeTax) => {
  if (!Array.isArray(products) || typeof serviceCharge !== 'number' || 
      !['monthly', 'annual'].includes(billingCycle) || typeof profitBeforeTax !== 'number') {
    throw new Error('Invalid input parameters');
  }

  const recommendations = [];
  const selectedCategories = products.map(p => p.category);
  const totalQty = products.reduce((sum, p) => sum + p.qty, 0);

  // 1. Margin improvement
  const lowMarginProducts = products.filter(p => getPricingData(p, p.qty).margin < 35);
  if (lowMarginProducts.length > 0) {
    lowMarginProducts.forEach(p => {
      recommendations.push(`Increase the margin for "${p.name}" (currently ${getPricingData(p, p.qty).margin}%) to at least 35% to improve profitability.`);
    });
  }

  // 2. Upsell higher-margin products
  const highMarginProducts = products.filter(p => getPricingData(p, p.qty).margin >= 40);
  if (highMarginProducts.length > 0) {
    highMarginProducts.forEach(p => {
      recommendations.push(`Focus on upselling "${p.name}" (margin ${getPricingData(p, p.qty).margin}%) for better profit.`);
    });
  }

  // 3. Bundle services
  if (products.length > 1) {
    recommendations.push("Bundle multiple products/services for a more attractive offer and higher total revenue.");
  }

  // 4. Service charge review
  if (serviceCharge < 100) {
    recommendations.push("Consider increasing your Professional Services & Support fee to at least $100/year to match industry averages.");
  }

  // 5. Profitability check
  if (profitBeforeTax < 0) {
    recommendations.push("Warning: Your current configuration is not profitable. Review your pricing and costs.");
  } else if (profitBeforeTax < 200) {
    recommendations.push("Your profit is low. Consider increasing margins or service fees, or reducing costs.");
  } else {
    recommendations.push("Your configuration is profitable. Look for further upsell opportunities or cost optimizations.");
  }

  // 6. Complementary product recommendations
  const complementaryCategories = {
    Desktop: ["Server", "SaaS"],
    Server: ["SaaS", "Virtual Server"],
    "Virtual Server": ["SaaS"],
    SaaS: ["Server", "Virtual Server"],
  };
  const missingCategories = Object.entries(complementaryCategories)
    .filter(([category]) => selectedCategories.includes(category))
    .flatMap(([, compCategories]) => 
      compCategories.filter(cat => !selectedCategories.includes(cat))
    )
    .filter((cat, index, self) => self.indexOf(cat) === index);
  if (missingCategories.length > 0) {
    const suggestedProduct = products.find(p => missingCategories.includes(p.category));
    if (suggestedProduct) {
      const potentialRevenue = formatCurrency(suggestedProduct.pricingSlabs[0].recommendedPrice * 5);
      recommendations.push(
        `Enhance your solution by adding a "${suggestedProduct.category}" product like "${suggestedProduct.name}". This can provide a more comprehensive backup strategy and increase your revenue by approximately $${potentialRevenue} for 5 units.`
      );
    }
  }

  return recommendations;
}; 
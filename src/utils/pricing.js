// Constants for financial calculations
export const FINANCIAL_CONSTANTS = {
  ANNUAL_DISCOUNT_RATE: 0.03,
  INDUSTRY_AVG_SERVICE_FEE: 100,
  SERVICE_FEE_THRESHOLD_LOW: 0.8,
  SERVICE_FEE_THRESHOLD_HIGH: 1.2,
  TAX_RATE: 0.13,
  DEFAULT_MARGIN: 0.35,
  MIN_MARGIN: 0.20,
  TARGET_MARGIN: 0.35,
  HIGH_MARGIN: 0.40,
  MIN_PROFIT_THRESHOLD: 200,
  MIN_SERVICE_FEE: 100,
  // Volume discount tiers
  VOLUME_DISCOUNTS: [
    { minQty: 5, discount: 0.05 },  // 5% off for 5+ units
    { minQty: 10, discount: 0.10 }, // 10% off for 10+ units
    { minQty: 20, discount: 0.15 }, // 15% off for 20+ units
    { minQty: 50, discount: 0.20 }  // 20% off for 50+ units
  ],
  // Seasonal pricing periods
  SEASONAL_PRICING: {
    Q1: { name: "New Year Special", discount: 0.10, months: [0, 1, 2] },    // Jan-Mar
    Q2: { name: "Spring Promotion", discount: 0.05, months: [3, 4, 5] },    // Apr-Jun
    Q3: { name: "Summer Sale", discount: 0.15, months: [6, 7, 8] },         // Jul-Sep
    Q4: { name: "Year-End Deal", discount: 0.20, months: [9, 10, 11] }      // Oct-Dec
  },
  // Payment processing fee constants
  PAYMENT_PROCESSING: {
    BASE_FEE: 0.30,
    PERCENTAGE_FEE: 0.0299,
    MIN_AMOUNT_FOR_WAIVER: 1000, // Minimum amount to qualify for fee waiver
    ANNUAL_COMMITMENT_WAIVER: true // Whether annual commitments qualify for fee waiver
  }
};

/**
 * Calculate volume discount based on quantity
 * @param {number} qty - Quantity
 * @returns {number} Discount percentage (0-1)
 */
export const calculateVolumeDiscount = (qty) => {
  const applicableDiscount = FINANCIAL_CONSTANTS.VOLUME_DISCOUNTS
    .filter(tier => qty >= tier.minQty)
    .sort((a, b) => b.discount - a.discount)[0];
  
  return applicableDiscount ? applicableDiscount.discount : 0;
};

/**
 * Get current seasonal pricing period
 * @returns {Object} Seasonal pricing period info
 */
export const getCurrentSeasonalPricing = () => {
  const currentMonth = new Date().getMonth();
  return Object.values(FINANCIAL_CONSTANTS.SEASONAL_PRICING)
    .find(period => period.months.includes(currentMonth)) || 
    { name: "Standard Pricing", discount: 0 };
};

/**
 * Get pricing data for a product based on quantity
 * @param {Object} product - Product object
 * @param {number} qty - Quantity
 * @returns {Object} Pricing slab data with discounts applied
 * @throws {Error} If product or quantity is invalid
 */
export const getPricingData = (product, qty) => {
  if (!product || !product.pricingSlabs) {
    throw new Error('Invalid product data');
  }
  
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error('Quantity must be a positive integer');
  }

  // Validate pricing slabs
  product.pricingSlabs.forEach(slab => {
    if (slab.unitCost < 0) {
      throw new Error(`Invalid unit cost (${slab.unitCost}) for product ${product.name}`);
    }
    if (slab.margin < FINANCIAL_CONSTANTS.MIN_MARGIN) {
      throw new Error(`Margin (${slab.margin}) below minimum threshold for product ${product.name}`);
    }
  });

  const slab = product.pricingSlabs.find(
    slab => qty >= slab.minQty && qty <= slab.maxQty
  ) || product.pricingSlabs[product.pricingSlabs.length - 1];

  // Calculate discounts
  const volumeDiscount = calculateVolumeDiscount(qty);
  const seasonalPricing = getCurrentSeasonalPricing();
  const totalDiscount = Math.min(volumeDiscount + seasonalPricing.discount, 0.30); // Cap total discount at 30%

  // Apply discounts to recommended price
  const discountedPrice = slab.recommendedPrice * (1 - totalDiscount);

  return {
    ...slab,
    recommendedPrice: formatCurrency(discountedPrice),
    volumeDiscount,
    seasonalDiscount: seasonalPricing.discount,
    totalDiscount,
    seasonalPeriod: seasonalPricing.name
  };
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
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount for currency formatting');
  }
  if (!isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  return Number(Math.round(amount + 'e2') + 'e-2');
};

/**
 * Calculate payment processing fee
 * @param {number} amount - Transaction amount
 * @param {boolean} isAnnual - Whether this is an annual commitment
 * @param {boolean} waiveFees - Whether to waive the fees
 * @returns {Object} Fee details
 */
export const calculatePaymentProcessingFee = (amount, isAnnual, waiveFees) => {
  if (waiveFees) {
    return {
      fee: 0,
      percentage: 0,
      baseFee: 0,
      isWaived: true,
      reason: isAnnual ? "Annual commitment" : "Fee waiver applied"
    };
  }

  const baseFee = FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.BASE_FEE;
  const percentageFee = amount * FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.PERCENTAGE_FEE;
  const totalFee = baseFee + percentageFee;

  // Check if amount qualifies for automatic waiver
  const qualifiesForWaiver = amount >= FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.MIN_AMOUNT_FOR_WAIVER ||
    (isAnnual && FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.ANNUAL_COMMITMENT_WAIVER);

  return {
    fee: qualifiesForWaiver ? 0 : totalFee,
    percentage: FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.PERCENTAGE_FEE,
    baseFee,
    isWaived: qualifiesForWaiver,
    reason: qualifiesForWaiver ? 
      (isAnnual ? "Annual commitment" : "Amount exceeds minimum threshold") : 
      "Standard processing fee"
  };
};

/**
 * Calculate total cost with all discounts and fees
 * @param {Object} product - Product object
 * @param {number} qty - Quantity
 * @param {boolean} isAnnual - Whether this is an annual commitment
 * @param {boolean} waiveFees - Whether to waive processing fees
 * @returns {Object} Complete pricing details
 */
export const calculateTotalCost = (product, qty, isAnnual, waiveFees) => {
  const pricingData = getPricingData(product, qty);
  const subtotal = pricingData.recommendedPrice * qty;
  const tax = subtotal * FINANCIAL_CONSTANTS.TAX_RATE;
  const processingFee = calculatePaymentProcessingFee(subtotal + tax, isAnnual, waiveFees);
  
  return {
    subtotal,
    tax,
    processingFee: processingFee.fee,
    total: subtotal + tax + processingFee.fee,
    discounts: {
      volume: pricingData.volumeDiscount,
      seasonal: pricingData.seasonalDiscount,
      total: pricingData.totalDiscount
    },
    fees: {
      processing: processingFee,
      tax: FINANCIAL_CONSTANTS.TAX_RATE
    },
    isAnnual,
    quantity: qty
  };
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
  const currentSeason = getCurrentSeasonalPricing();
  const isAnnual = billingCycle === 'annual';

  // Calculate total amount for fee waiver recommendations
  const totalAmount = products.reduce((sum, p) => {
    const pricingData = getPricingData(p, p.qty);
    return sum + (pricingData.recommendedPrice * p.qty);
  }, 0);

  // Payment processing fee recommendations
  if (!isAnnual && totalAmount < FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.MIN_AMOUNT_FOR_WAIVER) {
    const remainingForWaiver = FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.MIN_AMOUNT_FOR_WAIVER - totalAmount;
    recommendations.push(
      `Add $${remainingForWaiver.toFixed(2)} more to your order to qualify for automatic payment processing fee waiver.`
    );
  }

  if (!isAnnual && FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.ANNUAL_COMMITMENT_WAIVER) {
    recommendations.push(
      "Switch to annual billing to automatically waive payment processing fees."
    );
  }

  // Add seasonal pricing recommendation
  if (currentSeason.discount > 0) {
    recommendations.push(
      `Take advantage of our ${currentSeason.name} with ${(currentSeason.discount * 100).toFixed(0)}% off!`
    );
  }

  // Volume discount recommendations
  products.forEach(p => {
    const nextVolumeTier = FINANCIAL_CONSTANTS.VOLUME_DISCOUNTS
      .find(tier => tier.minQty > p.qty);
    
    if (nextVolumeTier) {
      const additionalQty = nextVolumeTier.minQty - p.qty;
      const potentialDiscount = nextVolumeTier.discount;
      recommendations.push(
        `Add ${additionalQty} more ${p.name} units to qualify for ${(potentialDiscount * 100).toFixed(0)}% volume discount.`
      );
    }
  });

  // 1. Margin improvement
  const lowMarginProducts = products.filter(p => getPricingData(p, p.qty).margin < FINANCIAL_CONSTANTS.TARGET_MARGIN);
  if (lowMarginProducts.length > 0) {
    lowMarginProducts.forEach(p => {
      const currentMargin = getPricingData(p, p.qty).margin;
      recommendations.push(
        `Increase the margin for "${p.name}" (currently ${(currentMargin * 100).toFixed(1)}%) to at least ${(FINANCIAL_CONSTANTS.TARGET_MARGIN * 100).toFixed(1)}% to improve profitability.`
      );
    });
  }

  // 2. Upsell higher-margin products
  const highMarginProducts = products.filter(p => getPricingData(p, p.qty).margin >= FINANCIAL_CONSTANTS.HIGH_MARGIN);
  if (highMarginProducts.length > 0) {
    highMarginProducts.forEach(p => {
      const margin = getPricingData(p, p.qty).margin;
      recommendations.push(`Focus on upselling "${p.name}" (margin ${(margin * 100).toFixed(1)}%) for better profit.`);
    });
  }

  // 3. Bundle services
  if (products.length > 1) {
    const bundleDiscount = FINANCIAL_CONSTANTS.ANNUAL_DISCOUNT_RATE * 100;
    recommendations.push(
      `Bundle multiple products/services for a more attractive offer. Consider offering a ${bundleDiscount}% discount for annual commitments.`
    );
  }

  // 4. Service charge review
  if (serviceCharge < FINANCIAL_CONSTANTS.MIN_SERVICE_FEE) {
    recommendations.push(
      `Consider increasing your Professional Services & Support fee to at least $${FINANCIAL_CONSTANTS.MIN_SERVICE_FEE}/year to match industry averages.`
    );
  }

  // 5. Profitability check
  if (profitBeforeTax < 0) {
    recommendations.push("Warning: Your current configuration is not profitable. Review your pricing and costs.");
  } else if (profitBeforeTax < FINANCIAL_CONSTANTS.MIN_PROFIT_THRESHOLD) {
    recommendations.push(
      `Your profit ($${profitBeforeTax.toFixed(2)}) is below the recommended threshold of $${FINANCIAL_CONSTANTS.MIN_PROFIT_THRESHOLD}. Consider increasing margins or service fees, or reducing costs.`
    );
  } else {
    recommendations.push(
      `Your configuration is profitable ($${profitBeforeTax.toFixed(2)}). Look for further upsell opportunities or cost optimizations.`
    );
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
      const annualRevenue = billingCycle === 'annual' ? 
        formatCurrency(potentialRevenue * 12) : 
        potentialRevenue;
      
      recommendations.push(
        `Enhance your solution by adding a "${suggestedProduct.category}" product like "${suggestedProduct.name}". ` +
        `This can provide a more comprehensive backup strategy and increase your revenue by approximately $${annualRevenue} ${billingCycle === 'annual' ? 'per year' : 'per month'} for 5 units.`
      );
    }
  }

  return recommendations;
}; 
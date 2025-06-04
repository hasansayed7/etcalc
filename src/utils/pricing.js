/**
 * @typedef {Object} Product
 * @property {string} name
 * @property {string} description
 * @property {string} license
 * @property {string} [category]
 * @property {Array<{minQty: number, maxQty: number, unitCost: number, margin?: number, recommendedPrice: number}>} pricingSlabs
 * @property {number} [unitCost]
 * @property {number} [margin]
 * @property {boolean} [isHomeGrown]
 * @property {number} [qty]
 */

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
    ANNUAL_COMMITMENT_WAIVER: true, // Whether annual commitments qualify for fee waiver
    // Tiered processing fees based on monthly transaction volume
    TIERED_FEES: [
      { minVolume: 0, baseFee: 0.30, percentageFee: 0.0299 },
      { minVolume: 10000, baseFee: 0.25, percentageFee: 0.0275 },
      { minVolume: 50000, baseFee: 0.20, percentageFee: 0.0250 },
      { minVolume: 100000, baseFee: 0.15, percentageFee: 0.0225 },
      { minVolume: 500000, baseFee: 0.10, percentageFee: 0.0200 }
    ]
  },
  // Customer loyalty tiers
  LOYALTY_TIERS: {
    BRONZE: {
      name: "Bronze",
      minSpend: 0,
      benefits: {
        processingFeeDiscount: 0,
        serviceFeeDiscount: 0,
        specialPromotions: false
      }
    },
    SILVER: {
      name: "Silver",
      minSpend: 5000,
      benefits: {
        processingFeeDiscount: 0.25, // 25% off processing fees
        serviceFeeDiscount: 0.10,    // 10% off service fees
        specialPromotions: true
      }
    },
    GOLD: {
      name: "Gold",
      minSpend: 20000,
      benefits: {
        processingFeeDiscount: 0.50, // 50% off processing fees
        serviceFeeDiscount: 0.20,    // 20% off service fees
        specialPromotions: true,
        prioritySupport: true
      }
    },
    PLATINUM: {
      name: "Platinum",
      minSpend: 50000,
      benefits: {
        processingFeeDiscount: 1.00, // 100% off processing fees
        serviceFeeDiscount: 0.30,    // 30% off service fees
        specialPromotions: true,
        prioritySupport: true,
        dedicatedAccountManager: true
      }
    }
  },
  // Enhanced commitment levels
  COMMITMENT_LEVELS: {
    MONTHLY: {
      name: "Monthly",
      discount: 0,
      minTerm: 1,
      cancellationFee: 0,
      features: ["Basic Support", "Standard Features"]
    },
    QUARTERLY: {
      name: "Quarterly",
      discount: 0.05,
      minTerm: 3,
      cancellationFee: 0.1,
      features: ["Priority Support", "Advanced Features", "Monthly Reports"]
    },
    BIANNUAL: {
      name: "Bi-Annual",
      discount: 0.10,
      minTerm: 6,
      cancellationFee: 0.15,
      features: ["Premium Support", "Enterprise Features", "Quarterly Reviews"]
    },
    ANNUAL: {
      name: "Annual",
      discount: 0.15,
      minTerm: 12,
      cancellationFee: 0.2,
      features: ["24/7 Support", "All Features", "Quarterly Reviews", "Dedicated Account Manager"]
    }
  },
  // Enhanced upsell opportunities
  UPSELL_OPPORTUNITIES: {
    PREMIUM_SUPPORT: {
      name: "Premium Support",
      basePrice: 199,
      margin: 0.75,
      minCommitment: "QUARTERLY",
      features: [
        "24/7 Priority Support",
        "Dedicated Account Manager",
        "Custom Integration Support",
        "Advanced Analytics"
      ]
    },
    ENTERPRISE_FEATURES: {
      name: "Enterprise Features",
      basePrice: 299,
      margin: 0.80,
      minCommitment: "BIANNUAL",
      features: [
        "Custom Workflows",
        "API Access",
        "Advanced Security",
        "Multi-region Support"
      ]
    },
    TRAINING_PACKAGE: {
      name: "Training Package",
      basePrice: 499,
      margin: 0.85,
      minCommitment: "QUARTERLY",
      features: [
        "On-site Training",
        "Custom Documentation",
        "Best Practices Guide",
        "Ongoing Support"
      ]
    },
    CUSTOM_INTEGRATION: {
      name: "Custom Integration",
      basePrice: 999,
      margin: 0.90,
      minCommitment: "ANNUAL",
      features: [
        "Custom API Development",
        "Integration Testing",
        "Performance Optimization",
        "Ongoing Maintenance"
      ]
    },
    DEDICATED_SERVER: {
      name: "Dedicated Server",
      basePrice: 799,
      margin: 0.85,
      minCommitment: "ANNUAL",
      features: [
        "Dedicated Hardware",
        "Custom Configuration",
        "24/7 Monitoring",
        "Backup Solutions"
      ]
    },
    SECURITY_PACKAGE: {
      name: "Security Package",
      basePrice: 399,
      margin: 0.80,
      minCommitment: "QUARTERLY",
      features: [
        "Advanced Encryption",
        "Security Auditing",
        "Compliance Support",
        "Regular Security Updates"
      ]
    }
  },
  // Dynamic pricing factors
  DYNAMIC_PRICING: {
    TIME_BASED: {
      PEAK_HOURS: { multiplier: 1.1, hours: [9, 10, 11, 14, 15, 16] },
      OFF_PEAK: { multiplier: 0.9, hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 20, 21, 22, 23] }
    },
    DEMAND_BASED: {
      HIGH: { threshold: 0.8, multiplier: 1.15 },
      MEDIUM: { threshold: 0.5, multiplier: 1.0 },
      LOW: { threshold: 0.2, multiplier: 0.85 }
    },
    CUSTOMER_BASED: {
      NEW: { multiplier: 1.0 },
      RETURNING: { multiplier: 0.95 },
      LOYAL: { multiplier: 0.90 }
    }
  },
  // Enhanced profit optimization
  PROFIT_OPTIMIZATION: {
    MIN_MARGIN: 0.30,
    TARGET_MARGIN: 0.40,
    HIGH_MARGIN: 0.50,
    MIN_COMMITMENT_DISCOUNT: 0.05,
    MAX_COMMITMENT_DISCOUNT: 0.20,
    BUNDLE_DISCOUNT: 0.10,
    REFERRAL_BONUS: 0.05,
    CROSS_SELL_THRESHOLD: 0.15,
    UPSELL_THRESHOLD: 0.25,
    RETENTION_BONUS: 0.10,
    EARLY_RENEWAL_DISCOUNT: 0.08,
    BULK_PURCHASE_THRESHOLD: 10,
    BULK_PURCHASE_DISCOUNT: 0.15
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
    if (slab.margin === null || slab.margin === undefined || isNaN(slab.margin)) {
      slab.margin = 0;
    }
  });

  const slab = product.pricingSlabs.find(
    slab => qty >= slab.minQty && qty <= slab.maxQty
  ) || product.pricingSlabs[product.pricingSlabs.length - 1];

  let recommendedPrice = slab.recommendedPrice;

  // Calculate discounts
  const volumeDiscount = calculateVolumeDiscount(qty);
  const seasonalPricing = getCurrentSeasonalPricing();
  const totalDiscount = Math.min(volumeDiscount + seasonalPricing.discount, 0.30); // Cap total discount at 30%

  // Apply discounts to recommended price
  const discountedPrice = recommendedPrice * (1 - totalDiscount);

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
 * Get customer loyalty tier based on total spend
 * @param {number} totalSpend - Total customer spend
 * @returns {Object} Loyalty tier details
 */
export const getLoyaltyTier = (totalSpend) => {
  const tiers = Object.entries(FINANCIAL_CONSTANTS.LOYALTY_TIERS)
    .sort(([, a], [, b]) => b.minSpend - a.minSpend);

  for (const [, tier] of tiers) {
    if (totalSpend >= tier.minSpend) {
      return tier;
    }
  }
  return FINANCIAL_CONSTANTS.LOYALTY_TIERS.BRONZE;
};

/**
 * Get tiered processing fee based on monthly volume
 * @param {number} monthlyVolume - Monthly transaction volume
 * @returns {Object} Fee tier details
 */
export const getProcessingFeeTier = (monthlyVolume) => {
  const tiers = FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.TIERED_FEES
    .sort((a, b) => b.minVolume - a.minVolume);

  for (const tier of tiers) {
    if (monthlyVolume >= tier.minVolume) {
      return tier;
    }
  }
  return tiers[tiers.length - 1];
};

/**
 * Calculate payment processing fee
 * @param {number} amount - Transaction amount
 * @param {boolean} isAnnual - Whether this is an annual commitment
 * @param {boolean} waiveFees - Whether to waive the fees
 * @param {number} monthlyVolume - Monthly transaction volume
 * @param {number} totalSpend - Total customer spend
 * @returns {Object} Fee details
 */
export const calculatePaymentProcessingFee = (amount, isAnnual, waiveFees, monthlyVolume = 0, totalSpend = 0) => {
  if (waiveFees) {
    return {
      fee: 0,
      percentage: 0,
      baseFee: 0,
      isWaived: true,
      reason: isAnnual ? "Annual commitment" : "Fee waiver applied"
    };
  }

  // Get applicable fee tier
  const feeTier = getProcessingFeeTier(monthlyVolume);
  const baseFee = feeTier.baseFee;
  const percentageFee = amount * feeTier.percentageFee;
  const totalFee = baseFee + percentageFee;

  // Get loyalty tier benefits
  const loyaltyTier = getLoyaltyTier(totalSpend);
  const loyaltyDiscount = loyaltyTier.benefits.processingFeeDiscount;
  const discountedFee = totalFee * (1 - loyaltyDiscount);

  // Check if amount qualifies for automatic waiver
  const qualifiesForWaiver = amount >= FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.MIN_AMOUNT_FOR_WAIVER ||
    (isAnnual && FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.ANNUAL_COMMITMENT_WAIVER) ||
    loyaltyTier.name === "PLATINUM";

  return {
    fee: qualifiesForWaiver ? 0 : discountedFee,
    percentage: feeTier.percentageFee,
    baseFee,
    isWaived: qualifiesForWaiver,
    reason: qualifiesForWaiver ? 
      (isAnnual ? "Annual commitment" : 
       loyaltyTier.name === "PLATINUM" ? "Platinum tier benefit" :
       "Amount exceeds minimum threshold") : 
      "Standard processing fee",
    loyaltyTier: loyaltyTier.name,
    feeTier: `$${feeTier.minVolume.toLocaleString()}+`,
    originalFee: totalFee,
    loyaltyDiscount: loyaltyDiscount * 100
  };
};

/**
 * Calculate fee savings analytics
 * @param {Object} feeDetails - Fee calculation details
 * @param {number} monthlyVolume - Monthly transaction volume
 * @param {number} totalSpend - Total customer spend
 * @returns {Object} Fee savings analytics
 */
export const calculateFeeSavings = (feeDetails, monthlyVolume, totalSpend) => {
  const currentTier = getLoyaltyTier(totalSpend);
  const currentFeeTier = getProcessingFeeTier(monthlyVolume);
  
  // Calculate potential savings from next loyalty tier
  const nextLoyaltyTier = Object.entries(FINANCIAL_CONSTANTS.LOYALTY_TIERS)
    .find(([, tier]) => tier.minSpend > currentTier.minSpend);
  
  let loyaltySavings = {
    current: {
      tier: currentTier.name,
      discount: currentTier.benefits.processingFeeDiscount * 100,
      monthlySavings: feeDetails.originalFee * currentTier.benefits.processingFeeDiscount,
      annualSavings: feeDetails.originalFee * currentTier.benefits.processingFeeDiscount * 12
    },
    next: null
  };

  if (nextLoyaltyTier) {
    const [, nextTierData] = nextLoyaltyTier;
    const nextTierDiscount = nextTierData.benefits.processingFeeDiscount;
    const potentialMonthlySavings = feeDetails.originalFee * nextTierDiscount;
    const currentMonthlySavings = feeDetails.originalFee * currentTier.benefits.processingFeeDiscount;
    
    loyaltySavings.next = {
      tier: nextTierData.name,
      discount: nextTierDiscount * 100,
      additionalMonthlySavings: potentialMonthlySavings - currentMonthlySavings,
      additionalAnnualSavings: (potentialMonthlySavings - currentMonthlySavings) * 12,
      requiredSpend: nextTierData.minSpend - totalSpend
    };
  }

  // Calculate potential savings from next fee tier
  const nextFeeTier = FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.TIERED_FEES
    .find(tier => tier.minVolume > currentFeeTier.minVolume);
  
  let volumeSavings = {
    current: {
      tier: `$${currentFeeTier.minVolume.toLocaleString()}+`,
      rate: currentFeeTier.percentageFee * 100,
      baseFee: currentFeeTier.baseFee,
      monthlyFees: feeDetails.originalFee,
      annualFees: feeDetails.originalFee * 12
    },
    next: null
  };

  if (nextFeeTier) {
    const potentialBaseFee = nextFeeTier.baseFee;
    const potentialPercentageFee = monthlyVolume * nextFeeTier.percentageFee;
    const potentialMonthlyFees = potentialBaseFee + potentialPercentageFee;
    const currentMonthlyFees = feeDetails.originalFee;
    
    volumeSavings.next = {
      tier: `$${nextFeeTier.minVolume.toLocaleString()}+`,
      rate: nextFeeTier.percentageFee * 100,
      baseFee: nextFeeTier.baseFee,
      potentialMonthlyFees,
      potentialAnnualFees: potentialMonthlyFees * 12,
      monthlySavings: currentMonthlyFees - potentialMonthlyFees,
      annualSavings: (currentMonthlyFees - potentialMonthlyFees) * 12,
      requiredVolume: nextFeeTier.minVolume - monthlyVolume
    };
  }

  // Calculate total savings
  const totalSavings = {
    current: {
      monthly: loyaltySavings.current.monthlySavings,
      annual: loyaltySavings.current.annualSavings,
      percentage: (loyaltySavings.current.monthlySavings / feeDetails.originalFee) * 100
    },
    potential: {
      monthly: (loyaltySavings.next?.additionalMonthlySavings || 0) + 
               (volumeSavings.next?.monthlySavings || 0),
      annual: (loyaltySavings.next?.additionalAnnualSavings || 0) + 
              (volumeSavings.next?.annualSavings || 0),
      percentage: ((loyaltySavings.next?.additionalMonthlySavings || 0) + 
                  (volumeSavings.next?.monthlySavings || 0)) / feeDetails.originalFee * 100
    }
  };

  return {
    loyaltySavings,
    volumeSavings,
    totalSavings,
    recommendations: generateSavingsRecommendations(loyaltySavings, volumeSavings)
  };
};

/**
 * Generate savings recommendations
 * @param {Object} loyaltySavings - Loyalty tier savings details
 * @param {Object} volumeSavings - Volume tier savings details
 * @returns {Array} Array of savings recommendations
 */
const generateSavingsRecommendations = (loyaltySavings, volumeSavings) => {
  const recommendations = [];

  if (loyaltySavings.next) {
    recommendations.push({
      type: 'loyalty',
      message: `Upgrade to ${loyaltySavings.next.tier} tier by spending $${loyaltySavings.next.requiredSpend.toFixed(2)} more to save an additional $${loyaltySavings.next.additionalMonthlySavings.toFixed(2)}/month on processing fees.`,
      potentialSavings: {
        monthly: loyaltySavings.next.additionalMonthlySavings,
        annual: loyaltySavings.next.additionalAnnualSavings
      }
    });
  }

  if (volumeSavings.next) {
    recommendations.push({
      type: 'volume',
      message: `Increase monthly volume by $${volumeSavings.next.requiredVolume.toFixed(2)} to qualify for the ${volumeSavings.next.tier} tier and save $${volumeSavings.next.monthlySavings.toFixed(2)}/month on processing fees.`,
      potentialSavings: {
        monthly: volumeSavings.next.monthlySavings,
        annual: volumeSavings.next.annualSavings
      }
    });
  }

  return recommendations;
};

/**
 * Generate detailed fee report
 * @param {Object} feeDetails - Fee calculation details
 * @param {number} monthlyVolume - Monthly transaction volume
 * @param {number} totalSpend - Total customer spend
 * @returns {Object} Detailed fee report
 */
export const generateFeeReport = (feeDetails, monthlyVolume, totalSpend) => {
  const savings = calculateFeeSavings(feeDetails, monthlyVolume, totalSpend);
  
  return {
    currentFees: {
      baseFee: feeDetails.baseFee,
      percentageFee: feeDetails.percentage * 100,
      totalFee: feeDetails.fee,
      isWaived: feeDetails.isWaived,
      waiverReason: feeDetails.reason
    },
    currentSavings: {
      loyaltyTier: savings.loyaltySavings.current.tier,
      loyaltyDiscount: savings.loyaltySavings.current.discount,
      monthlySavings: savings.loyaltySavings.current.monthlySavings,
      annualSavings: savings.loyaltySavings.current.annualSavings
    },
    potentialSavings: {
      loyaltyUpgrade: savings.loyaltySavings.next ? {
        tier: savings.loyaltySavings.next.tier,
        additionalDiscount: savings.loyaltySavings.next.discount - savings.loyaltySavings.current.discount,
        monthlySavings: savings.loyaltySavings.next.additionalMonthlySavings,
        annualSavings: savings.loyaltySavings.next.additionalAnnualSavings,
        requiredSpend: savings.loyaltySavings.next.requiredSpend
      } : null,
      volumeUpgrade: savings.volumeSavings.next ? {
        tier: savings.volumeSavings.next.tier,
        newRate: savings.volumeSavings.next.rate,
        newBaseFee: savings.volumeSavings.next.baseFee,
        monthlySavings: savings.volumeSavings.next.monthlySavings,
        annualSavings: savings.volumeSavings.next.annualSavings,
        requiredVolume: savings.volumeSavings.next.requiredVolume
      } : null
    },
    totalSavings: {
      current: {
        monthly: savings.totalSavings.current.monthly,
        annual: savings.totalSavings.current.annual,
        percentage: savings.totalSavings.current.percentage
      },
      potential: {
        monthly: savings.totalSavings.potential.monthly,
        annual: savings.totalSavings.potential.annual,
        percentage: savings.totalSavings.potential.percentage
      }
    },
    recommendations: savings.recommendations
  };
};

/**
 * Calculate commitment-based pricing
 * @param {number} basePrice - Base price of the product
 * @param {string} commitmentLevel - Commitment level (MONTHLY, QUARTERLY, etc.)
 * @param {number} quantity - Number of units
 * @returns {Object} Commitment pricing details
 */
export const calculateCommitmentPricing = (basePrice, commitmentLevel, quantity) => {
  const commitment = FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[commitmentLevel];
  if (!commitment) {
    throw new Error('Invalid commitment level');
  }

  const discount = commitment.discount;
  const discountedPrice = basePrice * (1 - discount);
  const totalPrice = discountedPrice * quantity;
  const savings = basePrice * quantity - totalPrice;

  return {
    commitmentLevel: commitment.name,
    basePrice,
    discountedPrice,
    quantity,
    totalPrice,
    savings,
    discount: discount * 100,
    minTerm: commitment.minTerm,
    cancellationFee: commitment.cancellationFee * 100
  };
};

/**
 * Get available upsell opportunities
 * @param {Array} currentProducts - Current product selection
 * @param {string} commitmentLevel - Current commitment level
 * @param {number} totalSpend - Total customer spend
 * @returns {Array} Available upsell opportunities
 */
export const getUpsellOpportunities = (currentProducts, commitmentLevel, totalSpend) => {
  const opportunities = [];
  const currentFeatures = new Set(currentProducts.flatMap(p => p.features || []));
  
  Object.entries(FINANCIAL_CONSTANTS.UPSELL_OPPORTUNITIES).forEach(([key, opportunity]) => {
    // Check if customer qualifies for this upsell
    const commitment = FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[opportunity.minCommitment];
    const qualifies = commitment && 
      FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[commitmentLevel].minTerm >= commitment.minTerm;

    if (qualifies) {
      const newFeatures = opportunity.features.filter(f => !currentFeatures.has(f));
      if (newFeatures.length > 0) {
        opportunities.push({
          ...opportunity,
          key,
          newFeatures,
          price: calculateCommitmentPricing(
            opportunity.basePrice,
            commitmentLevel,
            1
          ),
          potentialRevenue: opportunity.basePrice * (1 - FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[commitmentLevel].discount),
          margin: opportunity.margin * 100
        });
      }
    }
  });

  return opportunities;
};

/**
 * Calculate dynamic pricing based on various factors
 * @param {number} basePrice - Base price of the product
 * @param {Object} factors - Pricing factors
 * @returns {number} Adjusted price
 */
export const calculateDynamicPricing = (basePrice, factors = {}) => {
  let adjustedPrice = basePrice;
  const currentHour = new Date().getHours();
  
  // Time-based pricing
  if (FINANCIAL_CONSTANTS.DYNAMIC_PRICING.TIME_BASED.PEAK_HOURS.hours.includes(currentHour)) {
    adjustedPrice *= FINANCIAL_CONSTANTS.DYNAMIC_PRICING.TIME_BASED.PEAK_HOURS.multiplier;
  } else if (FINANCIAL_CONSTANTS.DYNAMIC_PRICING.TIME_BASED.OFF_PEAK.hours.includes(currentHour)) {
    adjustedPrice *= FINANCIAL_CONSTANTS.DYNAMIC_PRICING.TIME_BASED.OFF_PEAK.multiplier;
  }
  
  // Demand-based pricing
  if (factors.demandLevel) {
    const demandFactor = FINANCIAL_CONSTANTS.DYNAMIC_PRICING.DEMAND_BASED[factors.demandLevel];
    if (demandFactor) {
      adjustedPrice *= demandFactor.multiplier;
    }
  }
  
  // Customer-based pricing
  if (factors.customerType) {
    const customerFactor = FINANCIAL_CONSTANTS.DYNAMIC_PRICING.CUSTOMER_BASED[factors.customerType];
    if (customerFactor) {
      adjustedPrice *= customerFactor.multiplier;
    }
  }
  
  return formatCurrency(adjustedPrice);
};

/**
 * Generate email subject with customer name
 * @param {string} customerName - Customer's name
 * @param {string} commitmentLevel - Commitment level
 * @returns {string} Formatted email subject
 */
export const generateEmailSubject = (customerName, commitmentLevel) => {
  const quoteNumber = `QT${new Date().getFullYear()}${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
  const commitment = FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[commitmentLevel];
  const commitmentName = commitment ? commitment.name : 'Standard';
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `[${quoteNumber}] ExcelyTech Quote - ${customerName || "Customer"} | ${commitmentName} Plan | ${date}`;
};

/**
 * Calculate optimal pricing strategy with enhanced features
 * @param {Object} product - Product details
 * @param {number} quantity - Current quantity
 * @param {string} commitmentLevel - Current commitment level
 * @param {number} totalSpend - Total customer spend
 * @param {Object} factors - Dynamic pricing factors
 * @returns {Object} Optimal pricing strategy
 */
export const calculateOptimalPricing = (product, quantity, commitmentLevel, totalSpend, factors = {}) => {
  const currentMargin = getPricingData(product, quantity).margin;
  const loyaltyTier = getLoyaltyTier(totalSpend);
  const commitment = FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[commitmentLevel];
  
  // Calculate dynamic base price
  const dynamicBasePrice = calculateDynamicPricing(
    product.pricingSlabs[0].recommendedPrice,
    factors
  );
  
  const strategies = {
    quantity: {
      current: quantity,
      recommended: quantity,
      potential: 0
    },
    commitment: {
      current: commitmentLevel,
      recommended: commitmentLevel,
      potential: 0
    },
    upsells: [],
    crossSells: [],
    totalPotential: 0
  };

  // Enhanced quantity optimization
  if (currentMargin < FINANCIAL_CONSTANTS.PROFIT_OPTIMIZATION.TARGET_MARGIN) {
    const nextVolumeTier = FINANCIAL_CONSTANTS.VOLUME_DISCOUNTS
      .find(tier => tier.minQty > quantity);
    
    if (nextVolumeTier) {
      strategies.quantity.recommended = nextVolumeTier.minQty;
      strategies.quantity.potential = (nextVolumeTier.minQty - quantity) * dynamicBasePrice;
      
      // Add bulk purchase discount if applicable
      if (nextVolumeTier.minQty >= FINANCIAL_CONSTANTS.PROFIT_OPTIMIZATION.BULK_PURCHASE_THRESHOLD) {
        strategies.quantity.bulkDiscount = FINANCIAL_CONSTANTS.PROFIT_OPTIMIZATION.BULK_PURCHASE_DISCOUNT * 100;
      }
    }
  }

  // Enhanced commitment optimization
  const nextCommitment = Object.entries(FINANCIAL_CONSTANTS.COMMITMENT_LEVELS)
    .find(([key, level]) => level.minTerm > commitment.minTerm);
  
  if (nextCommitment) {
    const [nextLevel, nextCommitmentData] = nextCommitment;
    strategies.commitment.recommended = nextLevel;
    strategies.commitment.potential = dynamicBasePrice * 
      quantity * (nextCommitmentData.discount - commitment.discount);
    strategies.commitment.additionalFeatures = nextCommitmentData.features
      .filter(f => !commitment.features.includes(f));
  }

  // Enhanced upsell opportunities
  strategies.upsells = getUpsellOpportunities([product], commitmentLevel, totalSpend)
    .map(upsell => ({
      name: upsell.name,
      potential: upsell.potentialRevenue,
      margin: upsell.margin,
      features: upsell.newFeatures,
      dynamicPrice: calculateDynamicPricing(upsell.basePrice, factors)
    }));

  // Cross-sell opportunities
  if (currentMargin >= FINANCIAL_CONSTANTS.PROFIT_OPTIMIZATION.CROSS_SELL_THRESHOLD) {
    strategies.crossSells = Object.entries(FINANCIAL_CONSTANTS.UPSELL_OPPORTUNITIES)
      .filter(([key, opp]) => opp.margin >= FINANCIAL_CONSTANTS.PROFIT_OPTIMIZATION.UPSELL_THRESHOLD)
      .map(([key, opp]) => ({
        name: opp.name,
        potential: opp.basePrice * (1 - commitment.discount),
        margin: opp.margin,
        features: opp.features,
        dynamicPrice: calculateDynamicPricing(opp.basePrice, factors)
      }));
  }

  // Calculate total potential
  strategies.totalPotential = strategies.quantity.potential + 
    strategies.commitment.potential + 
    strategies.upsells.reduce((sum, upsell) => sum + upsell.potential, 0) +
    strategies.crossSells.reduce((sum, crossSell) => sum + crossSell.potential, 0);

  return strategies;
};

/**
 * Generate profit optimization recommendations
 * @param {Array} products - Current product selection
 * @param {string} commitmentLevel - Current commitment level
 * @param {number} totalSpend - Total customer spend
 * @returns {Array} Profit optimization recommendations
 */
export const getProfitOptimizationRecommendations = (products, commitmentLevel, totalSpend) => {
  const recommendations = [];
  
  // Analyze each product
  products.forEach(product => {
    const optimalPricing = calculateOptimalPricing(
      product,
      product.qty,
      commitmentLevel,
      totalSpend
    );

    // Quantity recommendations
    if (optimalPricing.quantity.recommended > optimalPricing.quantity.current) {
      recommendations.push({
        type: 'quantity',
        product: product.name,
        message: `Increase ${product.name} quantity to ${optimalPricing.quantity.recommended} units to qualify for volume discount and improve margin.`,
        potential: optimalPricing.quantity.potential
      });
    }

    // Commitment recommendations
    if (optimalPricing.commitment.recommended !== optimalPricing.commitment.current) {
      const nextCommitment = FINANCIAL_CONSTANTS.COMMITMENT_LEVELS[optimalPricing.commitment.recommended];
      recommendations.push({
        type: 'commitment',
        message: `Upgrade to ${nextCommitment.name} commitment to get ${(nextCommitment.discount * 100).toFixed(0)}% discount and improve profitability.`,
        potential: optimalPricing.commitment.potential
      });
    }

    // Upsell recommendations
    optimalPricing.upsells.forEach(upsell => {
      recommendations.push({
        type: 'upsell',
        name: upsell.name,
        message: `Add ${upsell.name} to get ${upsell.features.join(', ')}.`,
        potential: upsell.potential,
        margin: upsell.margin
      });
    });
  });

  // Sort recommendations by potential value
  return recommendations.sort((a, b) => b.potential - a.potential);
};

/**
 * Calculate total cost with all discounts and fees
 * @param {Object} product - Product object
 * @param {number} qty - Quantity
 * @param {boolean} isAnnual - Whether this is an annual commitment
 * @param {boolean} waiveFees - Whether to waive processing fees
 * @param {number} monthlyVolume - Monthly transaction volume
 * @param {number} totalSpend - Total customer spend
 * @param {Object} factors - Dynamic pricing factors
 * @returns {Object} Complete pricing details
 */
export const calculateTotalCost = (product, qty, isAnnual, waiveFees, monthlyVolume = 0, totalSpend = 0, factors = {}) => {
  const pricingData = getPricingData(product, qty);
  const dynamicPrice = calculateDynamicPricing(pricingData.recommendedPrice, factors);
  const subtotal = dynamicPrice * qty;
  const tax = subtotal * FINANCIAL_CONSTANTS.TAX_RATE;
  const processingFee = calculatePaymentProcessingFee(subtotal + tax, isAnnual, waiveFees, monthlyVolume, totalSpend);
  const loyaltyTier = getLoyaltyTier(totalSpend);
  const feeReport = generateFeeReport(processingFee, monthlyVolume, totalSpend);
  
  // Calculate commitment level
  const commitmentLevel = isAnnual ? 'ANNUAL' : 'MONTHLY';
  const commitmentPricing = calculateCommitmentPricing(dynamicPrice, commitmentLevel, qty);
  
  // Get upsell opportunities with dynamic pricing
  const upsellOpportunities = getUpsellOpportunities([product], commitmentLevel, totalSpend)
    .map(upsell => ({
      ...upsell,
      dynamicPrice: calculateDynamicPricing(upsell.basePrice, factors)
    }));
  
  // Get profit optimization recommendations
  const profitRecommendations = getProfitOptimizationRecommendations(
    [product], 
    commitmentLevel, 
    totalSpend
  );
  
  return {
    subtotal,
    tax,
    processingFee: processingFee.fee,
    total: subtotal + tax + processingFee.fee,
    discounts: {
      volume: pricingData.volumeDiscount,
      seasonal: pricingData.seasonalDiscount,
      total: pricingData.totalDiscount,
      commitment: commitmentPricing.discount,
      dynamic: factors.demandLevel ? 
        (1 - FINANCIAL_CONSTANTS.DYNAMIC_PRICING.DEMAND_BASED[factors.demandLevel].multiplier) * 100 : 0
    },
    fees: {
      processing: processingFee,
      tax: FINANCIAL_CONSTANTS.TAX_RATE
    },
    loyalty: {
      tier: loyaltyTier.name,
      benefits: loyaltyTier.benefits
    },
    commitment: commitmentPricing,
    upsellOpportunities,
    profitRecommendations,
    feeReport,
    dynamicPricing: {
      basePrice: pricingData.recommendedPrice,
      adjustedPrice: dynamicPrice,
      factors
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
 * @param {number} totalSpend - Total customer spend
 * @param {number} monthlyVolume - Monthly transaction volume
 * @returns {Array} Array of recommendations
 */
export const getRecommendations = (products, serviceCharge, billingCycle, profitBeforeTax, totalSpend = 0, monthlyVolume = 0) => {
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

  // Loyalty tier recommendations
  const currentTier = getLoyaltyTier(totalSpend);
  const nextTier = Object.entries(FINANCIAL_CONSTANTS.LOYALTY_TIERS)
    .find(([, tier]) => tier.minSpend > currentTier.minSpend);

  if (nextTier) {
    const [, nextTierData] = nextTier;
    const remainingForNextTier = nextTierData.minSpend - totalSpend;
    recommendations.push(
      `Add $${remainingForNextTier.toFixed(2)} more to your total spend to reach ${nextTierData.name} tier and get ${(nextTierData.benefits.processingFeeDiscount * 100).toFixed(0)}% off processing fees.`
    );
  }

  // Volume-based fee tier recommendations
  const currentFeeTier = getProcessingFeeTier(monthlyVolume);
  const nextFeeTier = FINANCIAL_CONSTANTS.PAYMENT_PROCESSING.TIERED_FEES
    .find(tier => tier.minVolume > currentFeeTier.minVolume);

  if (nextFeeTier) {
    const remainingForNextTier = nextFeeTier.minVolume - monthlyVolume;
    recommendations.push(
      `Increase your monthly volume by $${remainingForNextTier.toFixed(2)} to qualify for lower processing fees (${(nextFeeTier.percentageFee * 100).toFixed(2)}% + $${nextFeeTier.baseFee.toFixed(2)}).`
    );
  }

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

/**
 * Calculate all derived fields for a product row (unit cost, margin, price, total, etc.)
 * @param {Product} product
 * @param {number} qty
 * @param {string} billingCycle
 * @returns {Object}
 */
export function calculateProductRow(product, qty, billingCycle) {
  // Find the correct pricing slab
  const slab = (product.pricingSlabs || []).find(
    slab => qty >= slab.minQty && qty <= slab.maxQty
  ) || (product.pricingSlabs ? product.pricingSlabs[product.pricingSlabs.length - 1] : { unitCost: 0, margin: 0, recommendedPrice: 0 });
  let unitCost = typeof product.unitCost === 'number' ? product.unitCost : slab.unitCost;
  unitCost = unitCost * 1.13;
  const margin = typeof product.margin === 'number' ? product.margin : (slab.margin || 0);
  const price = unitCost * (1 + margin / 100);
  const billingMultiplier = billingCycle === 'annual' ? 12 : 1;
  const total = price * qty * billingMultiplier;
  return {
    ...product,
    qty,
    unitCost,
    margin,
    price,
    total,
    slab
  };
} 
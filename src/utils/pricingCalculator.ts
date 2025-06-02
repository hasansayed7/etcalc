// Types and Interfaces
interface LineItem {
  unitCost: number;
  marginPercent: number;
  quantity?: number; // Optional quantity, defaults to 1
}

interface PricingBreakdown {
  // Cost Structure
  unitCosts: number[];
  totalUnitCost: number;
  tax1Amount: number;
  unitPrices: number[];
  totalUnitPrice: number;
  marginAmounts: number[];
  totalMarginAmount: number;
  totalWithMargin: number;

  // Taxation
  tax2Amount: number;
  totalWithTax: number;

  // Processing Fees
  stripeFees: number;
  totalStripeFees: number;

  // Gross Total
  grossTotal: number;
}

// Constants
const TAX_RATE = 0.13; // 13%
const STRIPE_PERCENTAGE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 0.30; // $0.30

/**
 * Calculate pricing breakdown for a single line item
 */
function calculateLineItem(item: LineItem): {
  unitCost: number;
  tax1Amount: number;
  unitPrice: number;
  marginAmount: number;
  unitPriceWithMargin: number;
} {
  const quantity = item.quantity || 1;
  const unitCost = item.unitCost * quantity;
  const tax1Amount = unitCost * TAX_RATE;
  const unitPrice = unitCost + tax1Amount;
  const marginAmount = unitPrice * (item.marginPercent / 100);
  const unitPriceWithMargin = unitPrice + marginAmount;

  return {
    unitCost,
    tax1Amount,
    unitPrice,
    marginAmount,
    unitPriceWithMargin,
  };
}

/**
 * Calculate complete pricing breakdown for multiple line items
 */
export function calculatePricing(items: LineItem[]): PricingBreakdown {
  // Calculate individual line items
  const lineItemCalculations = items.map(calculateLineItem);

  // Extract arrays of values
  const unitCosts = lineItemCalculations.map(item => item.unitCost);
  const tax1Amounts = lineItemCalculations.map(item => item.tax1Amount);
  const unitPrices = lineItemCalculations.map(item => item.unitPrice);
  const marginAmounts = lineItemCalculations.map(item => item.marginAmount);
  const unitPricesWithMargin = lineItemCalculations.map(item => item.unitPriceWithMargin);

  // Calculate totals
  const totalUnitCost = unitCosts.reduce((sum, cost) => sum + cost, 0);
  const totalUnitPrice = unitPrices.reduce((sum, price) => sum + price, 0);
  const totalMarginAmount = marginAmounts.reduce((sum, margin) => sum + margin, 0);
  const totalWithMargin = unitPricesWithMargin.reduce((sum, price) => sum + price, 0);

  // Calculate tax 2
  const tax2Amount = totalWithMargin * TAX_RATE;
  const totalWithTax = totalWithMargin + tax2Amount;

  // Calculate Stripe fees
  const stripeFees = totalWithTax * STRIPE_PERCENTAGE;
  const totalStripeFees = stripeFees + STRIPE_FIXED_FEE;

  // Calculate gross total
  const grossTotal = totalWithTax + totalStripeFees;

  return {
    unitCosts,
    totalUnitCost,
    tax1Amount: tax1Amounts.reduce((sum, tax) => sum + tax, 0),
    unitPrices,
    totalUnitPrice,
    marginAmounts,
    totalMarginAmount,
    totalWithMargin,
    tax2Amount,
    totalWithTax,
    stripeFees,
    totalStripeFees,
    grossTotal,
  };
}

// Sample usage and test data
const sampleItems: LineItem[] = [
  {
    unitCost: 100,
    marginPercent: 35,
    quantity: 2,
  },
  {
    unitCost: 50,
    marginPercent: 25,
    quantity: 1,
  },
  {
    unitCost: 75,
    marginPercent: 40,
    quantity: 3,
  },
];

// Example usage:
/*
const pricing = calculatePricing(sampleItems);
console.log('Pricing Breakdown:', pricing);
*/ 
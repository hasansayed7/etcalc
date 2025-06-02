// Export an empty array for products to start fresh
export const PRODUCTS = [
  {
    name: "SPX Desktop",
    description: "Backup solution for desktops",
    license: "Per Desktop License",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 5.88, margin: 0.35, recommendedPrice: 5.88 * 1.35 },
      { minQty: 26, maxQty: 50, unitCost: 5.66, margin: 0.35, recommendedPrice: 5.66 * 1.35 },
      { minQty: 51, maxQty: 100, unitCost: 5.35, margin: 0.35, recommendedPrice: 5.35 * 1.35 },
      { minQty: 101, maxQty: 150, unitCost: 4.99, margin: 0.35, recommendedPrice: 4.99 * 1.35 },
      { minQty: 151, maxQty: 9999, unitCost: 4.66, margin: 0.35, recommendedPrice: 4.66 * 1.35 },
    ],
  },
  {
    name: "SPX SBS",
    description: "Backup solution for Small Business Servers",
    license: "Per Server License",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 24.05, margin: 0.35, recommendedPrice: 24.05 * 1.35 },
      { minQty: 26, maxQty: 50, unitCost: 22.79, margin: 0.35, recommendedPrice: 22.79 * 1.35 },
      { minQty: 51, maxQty: 100, unitCost: 21.13, margin: 0.35, recommendedPrice: 21.13 * 1.35 },
      { minQty: 101, maxQty: 150, unitCost: 19.26, margin: 0.35, recommendedPrice: 19.26 * 1.35 },
      { minQty: 151, maxQty: 9999, unitCost: 17.72, margin: 0.35, recommendedPrice: 17.72 * 1.35 },
    ],
  },
  {
    name: "SPX VM",
    description: "Backup solution for Virtual Machines",
    license: "Per VM License",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 30.00, margin: 0.35, recommendedPrice: 30.00 * 1.35 },
      { minQty: 26, maxQty: 50, unitCost: 30.00, margin: 0.35, recommendedPrice: 30.00 * 1.35 },
      { minQty: 51, maxQty: 100, unitCost: 30.00, margin: 0.35, recommendedPrice: 30.00 * 1.35 },
      { minQty: 101, maxQty: 150, unitCost: 30.00, margin: 0.35, recommendedPrice: 30.00 * 1.35 },
      { minQty: 151, maxQty: 9999, unitCost: 27.76, margin: 0.35, recommendedPrice: 27.76 * 1.35 },
    ],
  },
  {
    name: "SPX PS",
    description: "Backup solution for Physical Servers",
    license: "Per Server License",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 43.22, margin: 0.35, recommendedPrice: 43.22 * 1.35 },
      { minQty: 26, maxQty: 50, unitCost: 40.14, margin: 0.35, recommendedPrice: 40.14 * 1.35 },
      { minQty: 51, maxQty: 100, unitCost: 36.10, margin: 0.35, recommendedPrice: 36.10 * 1.35 },
      { minQty: 101, maxQty: 150, unitCost: 31.51, margin: 0.35, recommendedPrice: 31.51 * 1.35 },
      { minQty: 151, maxQty: 9999, unitCost: 27.76, margin: 0.35, recommendedPrice: 27.76 * 1.35 },
    ],
  },
]; 
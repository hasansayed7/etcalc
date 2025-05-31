export const PRODUCTS = [
  {
    name: "Arcserve SPX Desktop Edition",
    description: "Backup solution for desktops",
    license: "Per Desktop License",
    category: "Desktop",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 5.88, recommendedPrice: 7.94, margin: 35 },
      { minQty: 26, maxQty: 50, unitCost: 5.66, recommendedPrice: 7.75, margin: 37 },
      { minQty: 51, maxQty: 100, unitCost: 5.35, recommendedPrice: 7.54, margin: 41 },
      { minQty: 101, maxQty: 150, unitCost: 4.99, recommendedPrice: 7.24, margin: 45 },
      { minQty: 151, maxQty: 9999, unitCost: 4.66, recommendedPrice: 6.94, margin: 49 }
    ],
  },
  {
    name: "Arcserve SPX Server Edition (Microsoft OS)",
    description: "Backup solution for Microsoft servers",
    license: "Per Server License",
    category: "Server",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 43.22, recommendedPrice: 58.35, margin: 35 },
      { minQty: 26, maxQty: 50, unitCost: 40.14, recommendedPrice: 55.00, margin: 37 },
      { minQty: 51, maxQty: 100, unitCost: 36.10, recommendedPrice: 50.90, margin: 41 },
      { minQty: 101, maxQty: 150, unitCost: 31.51, recommendedPrice: 45.69, margin: 45 },
      { minQty: 151, maxQty: 9999, unitCost: 27.76, recommendedPrice: 41.36, margin: 49 }
    ],
  },
  {
    name: "Arcserve SPX Server Edition (Linux OS)",
    description: "Backup solution for Linux servers",
    license: "Per Server License",
    category: "Server",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 43.22, recommendedPrice: 58.35, margin: 35 },
      { minQty: 26, maxQty: 50, unitCost: 40.14, recommendedPrice: 55.00, margin: 37 },
      { minQty: 51, maxQty: 100, unitCost: 36.10, recommendedPrice: 50.90, margin: 41 },
      { minQty: 101, maxQty: 150, unitCost: 31.51, recommendedPrice: 45.69, margin: 45 },
      { minQty: 151, maxQty: 9999, unitCost: 27.76, recommendedPrice: 41.36, margin: 49 }
    ],
  },
  {
    name: "Arcserve SPX Virtual Server Edition (Microsoft OS)",
    description: "Backup solution for Microsoft virtual servers",
    license: "Per VM License",
    category: "Virtual Server",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 26, maxQty: 50, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 51, maxQty: 100, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 101, maxQty: 150, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 151, maxQty: 9999, unitCost: 27.76, recommendedPrice: 38.86, margin: 40 }
    ],
  },
  {
    name: "Arcserve SPX Virtual Server Edition (Linux OS)",
    description: "Backup solution for Linux virtual servers",
    license: "Per VM License",
    category: "Virtual Server",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 26, maxQty: 50, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 51, maxQty: 100, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 101, maxQty: 150, unitCost: 30.00, recommendedPrice: 40.50, margin: 35 },
      { minQty: 151, maxQty: 9999, unitCost: 27.76, recommendedPrice: 38.86, margin: 40 }
    ],
  },
  {
    name: "Arcserve SPX SBS Edition",
    description: "Backup solution for Small Business Servers",
    license: "Per Server License",
    category: "Server",
    pricingSlabs: [
      { minQty: 1, maxQty: 25, unitCost: 24.05, recommendedPrice: 32.47, margin: 35 },
      { minQty: 26, maxQty: 50, unitCost: 22.79, recommendedPrice: 31.23, margin: 37 },
      { minQty: 51, maxQty: 100, unitCost: 21.13, recommendedPrice: 29.80, margin: 41 },
      { minQty: 101, maxQty: 150, unitCost: 19.26, recommendedPrice: 27.93, margin: 45 },
      { minQty: 151, maxQty: 9999, unitCost: 17.72, recommendedPrice: 26.40, margin: 49 }
    ],
  },
  {
    name: "Arcserve SaaS Backup for Office365 (AWS)",
    description: "Cloud backup for Office365 (AWS)",
    license: "Per User License",
    category: "SaaS",
    pricingSlabs: [
      { minQty: 1, maxQty: 9999, unitCost: 4.00, recommendedPrice: 5.40, margin: 35 }
    ],
  },
  {
    name: "Arcserve SaaS Backup for Office365 (Azure)",
    description: "Cloud backup for Office365 (Azure)",
    license: "Per User License",
    category: "SaaS",
    pricingSlabs: [
      { minQty: 1, maxQty: 9999, unitCost: 4.00, recommendedPrice: 5.40, margin: 35 }
    ],
  },
  {
    name: "Arcserve SaaS Backup for GSuite (AWS)",
    description: "Cloud backup for GSuite (AWS)",
    license: "Per User License",
    category: "SaaS",
    pricingSlabs: [
      { minQty: 1, maxQty: 9999, unitCost: 4.00, recommendedPrice: 5.40, margin: 35 }
    ],
  },
  {
    name: "Arcserve SaaS Backup for GSuite (Azure)",
    description: "Cloud backup for GSuite (Azure)",
    license: "Per User License",
    category: "SaaS",
    pricingSlabs: [
      { minQty: 1, maxQty: 9999, unitCost: 4.00, recommendedPrice: 5.40, margin: 35 }
    ],
  },
  {
    name: "ET DR For VMs",
    description: "Disaster Recovery service per VM",
    license: "Annual",
    category: "DR",
    pricingSlabs: [
      { minQty: 1, maxQty: 9999, unitCost: 200, margin: 0, recommendedPrice: 226 }
    ],
    isHomeGrown: true // Custom flag to identify for Pax8 exclusion
  }
]; 
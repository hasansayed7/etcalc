import React, { useState } from 'react';

const PricingCalculator = () => {
  // Initial hardcoded products
  const initialProducts = [
    { name: "SPX Desktop", pricingTiers: [{ range: [1, 25], sellingPrice: 5.88, cost: 4.00 }, { range: [26, 50], sellingPrice: 5.66, cost: 4.00 }, { range: [51, 100], sellingPrice: 5.35, cost: 4.00 }, { range: [101, 150], sellingPrice: 4.99, cost: 4.00 }, { range: [151, Infinity], sellingPrice: 4.66, cost: 4.00 }], quantity: 1, discount: 0, professionalFees: 0, supportFees: 0, category: "Business Continuity" },
    { name: "SPX VMs", pricingTiers: [{ range: [1, 150], sellingPrice: 30.00, cost: 20.00 }, { range: [151, Infinity], sellingPrice: 27.76, cost: 18.00 }], quantity: 1, discount: 0, professionalFees: 0, supportFees: 0, category: "Business Continuity" },
    { name: "SPX SBS", pricingTiers: [{ range: [1, 25], sellingPrice: 24.05, cost: 16.00 }, { range: [26, 50], sellingPrice: 22.79, cost: 15.00 }, { range: [51, 100], sellingPrice: 21.13, cost: 14.00 }, { range: [101, 150], sellingPrice: 19.26, cost: 13.00 }, { range: [151, Infinity], sellingPrice: 17.72, cost: 12.00 }], quantity: 1, discount: 0, professionalFees: 0, supportFees: 0, category: "Business Continuity" },
    { name: "SPX Physical Server", pricingTiers: [{ range: [1, 25], sellingPrice: 43.22, cost: 30.00 }, { range: [26, 50], sellingPrice: 40.14, cost: 28.00 }, { range: [51, 100], sellingPrice: 36.10, cost: 25.00 }, { range: [101, 150], sellingPrice: 31.51, cost: 22.00 }, { range: [151, Infinity], sellingPrice: 27.76, cost: 19.00 }], quantity: 1, discount: 0, professionalFees: 0, supportFees: 0, category: "Business Continuity" },
    { name: "ESET Antivirus", pricingTiers: [{ range: [1, 5], sellingPrice: 2.50, cost: 1.50 }, { range: [6, 10], sellingPrice: 2.00, cost: 1.20 }, { range: [11, Infinity], sellingPrice: 1.80, cost: 1.00 }], quantity: 1, discount: 0, professionalFees: 0, supportFees: 0, category: "Data Protection" },
    { name: "ESET MSP", pricingTiers: [{ range: [1, Infinity], sellingPrice: 1.50, cost: 1.00 }], quantity: 1, discount: 0, professionalFees: 0, supportFees: 0, category: "Data Protection" },
  ];

  const [products, setProducts] = useState(initialProducts);
  const [packages, setPackages] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", sellingPrice: "", cost: "", givenMargin: "", category: "Other", quantityRange: "", professionalFees: "", supportFees: "", discount: "" });
  const [newPackage, setNewPackage] = useState({ name: "", selectedProducts: [], promotion: 0 });

  // Helper Functions
  const getTieredPrice = (product, quantity) => {
    const tier = product.pricingTiers.find(t => quantity >= t.range[0] && quantity <= t.range[1]);
    return tier || product.pricingTiers[0];
  };

  const calculateProduct = (product) => {
    const isDR = product.name.toLowerCase().includes("disaster recovery");
    const tier = product.pricingTiers ? getTieredPrice(product, product.quantity) : { sellingPrice: product.sellingPrice, cost: product.cost };
    const sellingPrice = tier.sellingPrice;
    const cost = tier.cost;
    const discount = isDR ? 0 : (product.discount || 0);
    const discountedPrice = sellingPrice * (1 - discount / 100);
    const hst = discountedPrice * 0.13;
    const finalPrice = discountedPrice + hst + (isDR ? 0 : (product.professionalFees || 0)) + (isDR ? 0 : (product.supportFees || 0));
    const margin = ((discountedPrice - cost) / discountedPrice) * 100;
    return { ...product, discountedPrice: discountedPrice.toFixed(2), hst: hst.toFixed(2), finalPrice: finalPrice.toFixed(2), margin: margin.toFixed(2) };
  };

  const calculatePackage = (pkg) => {
    const selectedProducts = products.filter(p => pkg.selectedProducts.includes(p.name)).map(calculateProduct);
    const totalSellingPrice = selectedProducts.reduce((sum, p) => sum + parseFloat(p.discountedPrice), 0);
    const totalCost = selectedProducts.reduce((sum, p) => sum + parseFloat(getTieredPrice(p, p.quantity).cost), 0);
    const promotionalPrice = totalSellingPrice * (1 - (pkg.promotion || 0) / 100);
    const totalHst = promotionalPrice * 0.13;
    const totalProfessionalFees = selectedProducts.reduce((sum, p) => sum + (p.professionalFees || 0), 0);
    const totalSupportFees = selectedProducts.reduce((sum, p) => sum + (p.supportFees || 0), 0);
    const totalFinalPrice = promotionalPrice + totalHst + totalProfessionalFees + totalSupportFees;
    const overallMargin = ((promotionalPrice - totalCost) / promotionalPrice) * 100;
    return { ...pkg, totalSellingPrice, promotionalPrice: promotionalPrice.toFixed(2), totalHst: totalHst.toFixed(2), totalFinalPrice: totalFinalPrice.toFixed(2), overallMargin: overallMargin.toFixed(2) };
  };

  const getSuggestions = () => {
    const suggestions = [];
    products.forEach(p => {
      const calc = calculateProduct(p);
      const isDR = p.name.toLowerCase().includes("disaster recovery");
      if (!isDR && calc.margin > 20) {
        const discountToApply = ((calc.discountedPrice - (calc.cost / (1 - 0.20))) / calc.discountedPrice) * 100;
        suggestions.push({ text: `Apply ${discountToApply.toFixed(1)}% discount to ${p.name} to reduce margin to ~20%`, action: () => setProducts(products.map(prod => prod.name === p.name ? { ...prod, discount: discountToApply } : prod)) });
      }
    });
    packages.forEach(pkg => {
      const calc = calculatePackage(pkg);
      if (calc.overallMargin > 15) {
        const promotionToApply = ((calc.promotionalPrice - (calc.totalCost / (1 - 0.15))) / calc.promotionalPrice) * 100;
        suggestions.push({ text: `Apply ${promotionToApply.toFixed(1)}% promotion to ${pkg.name} to reduce margin to ~15%`, action: () => setPackages(packages.map(p => p.name === pkg.name ? { ...p, promotion: promotionToApply } : p)) });
      }
    });
    // Bundling suggestion
    if (products.some(p => p.category === "Data Protection") && products.some(p => p.category === "Business Continuity")) {
      suggestions.push({ text: "Bundle a Data Protection product with a Business Continuity product for better value", action: () => {} });
    }
    return suggestions;
  };

  const isMarginViolation = () => {
    return products.some(p => !p.name.toLowerCase().includes("disaster recovery") && calculateProduct(p).margin < 20) ||
           packages.some(p => calculatePackage(p).overallMargin < 15);
  };

  // Handlers
  const handleAddProduct = (e) => {
    e.preventDefault();
    const product = {
      name: newProduct.name,
      pricingTiers: [{ range: [1, Infinity], sellingPrice: parseFloat(newProduct.sellingPrice), cost: parseFloat(newProduct.cost) }],
      quantity: 1,
      discount: parseFloat(newProduct.discount) || 0,
      professionalFees: parseFloat(newProduct.professionalFees) || 0,
      supportFees: parseFloat(newProduct.supportFees) || 0,
      category: newProduct.category,
    };
    setProducts([...products, product]);
    setNewProduct({ name: "", sellingPrice: "", cost: "", givenMargin: "", category: "Other", quantityRange: "", professionalFees: "", supportFees: "", discount: "" });
  };

  const handleAddPackage = (e) => {
    e.preventDefault();
    setPackages([...packages, { ...newPackage }]);
    setNewPackage({ name: "", selectedProducts: [], promotion: 0 });
  };

  const calculatedProducts = products.map(calculateProduct);
  const calculatedPackages = packages.map(calculatePackage);
  const suggestions = getSuggestions();

  return (
    <div>
      <h1>Pricing Calculator</h1>

      {/* Product Form */}
      <h2>Add New Product</h2>
      <form onSubmit={handleAddProduct}>
        <input type="text" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
        <input type="number" placeholder="Selling Price" value={newProduct.sellingPrice} onChange={e => setNewProduct({ ...newProduct, sellingPrice: e.target.value })} required min="0" step="0.01" />
        <input type="number" placeholder="Cost" value={newProduct.cost} onChange={e => setNewProduct({ ...newProduct, cost: e.target.value })} required min="0" step="0.01" />
        <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
          <option value="Data Protection">Data Protection</option>
          <option value="Business Continuity">Business Continuity</option>
          <option value="Other">Other</option>
        </select>
        <input type="number" placeholder="Professional Fees" value={newProduct.professionalFees} onChange={e => setNewProduct({ ...newProduct, professionalFees: e.target.value })} disabled={newProduct.name.toLowerCase().includes("disaster recovery")} min="0" step="0.01" />
        <input type="number" placeholder="Support Fees" value={newProduct.supportFees} onChange={e => setNewProduct({ ...newProduct, supportFees: e.target.value })} disabled={newProduct.name.toLowerCase().includes("disaster recovery")} min="0" step="0.01" />
        <input type="number" placeholder="Discount (%)" value={newProduct.discount} onChange={e => setNewProduct({ ...newProduct, discount: e.target.value })} disabled={newProduct.name.toLowerCase().includes("disaster recovery")} min="0" max="100" step="0.1" />
        <button type="submit">Add Product</button>
      </form>

      {/* Product Table */}
      <h2>Products</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Selling Price</th>
            <th>Discounted Price</th>
            <th>HST</th>
            <th>Final Price</th>
            <th>Margin (%)</th>
          </tr>
        </thead>
        <tbody>
          {calculatedProducts.map(p => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td><input type="number" value={p.quantity} onChange={e => setProducts(products.map(prod => prod.name === p.name ? { ...prod, quantity: parseInt(e.target.value) || 1 } : prod))} min="1" /></td>
              <td>{getTieredPrice(p, p.quantity).sellingPrice}</td>
              <td>{p.discountedPrice}</td>
              <td>{p.hst}</td>
              <td>{p.finalPrice}</td>
              <td>{p.margin}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Package Form */}
      <h2>Create Package</h2>
      <form onSubmit={handleAddPackage}>
        <input type="text" placeholder="Package Name" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} required />
        <select multiple value={newPackage.selectedProducts} onChange={e => setNewPackage({ ...newPackage, selectedProducts: Array.from(e.target.selectedOptions, option => option.value) })}>
          {products.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <input type="number" placeholder="Promotion (%)" value={newPackage.promotion} onChange={e => setNewPackage({ ...newPackage, promotion: parseFloat(e.target.value) || 0 })} min="0" max="100" step="0.1" />
        <button type="submit">Add Package</button>
      </form>

      {/* Package Table */}
      <h2>Packages</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Promotional Price</th>
            <th>Total HST</th>
            <th>Total Final Price</th>
            <th>Overall Margin (%)</th>
          </tr>
        </thead>
        <tbody>
          {calculatedPackages.map(p => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{p.promotionalPrice}</td>
              <td>{p.totalHst}</td>
              <td>{p.totalFinalPrice}</td>
              <td>{p.overallMargin}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Financial Summary */}
      <h2>Financial Summary</h2>
      <div style={{ backgroundColor: isMarginViolation() ? "red" : "white", padding: "10px" }}>
        <p>Total Final Price (All Products): ${calculatedProducts.reduce((sum, p) => sum + parseFloat(p.finalPrice), 0).toFixed(2)}</p>
        <p>Total Final Price (All Packages): ${calculatedPackages.reduce((sum, p) => sum + parseFloat(p.totalFinalPrice), 0).toFixed(2)}</p>
      </div>

      {/* Suggestions */}
      <h2>Suggestions</h2>
      <ul>
        {suggestions.map((s, i) => (
          <li key={i}>
            {s.text} <button onClick={s.action}>Apply</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PricingCalculator;

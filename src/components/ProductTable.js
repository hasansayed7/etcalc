import React from "react";
import { calculateProductRow } from "../utils/pricing";

/**
 * @param {Object} props
 * @param {Array} props.products - Array of product objects
 * @param {string} props.billingCycle - 'monthly' or 'annual'
 * @param {Object} props.styles - Style object
 * @param {Function} props.updateQty - Handler for quantity change
 * @param {Function} props.updateUnitCost - Handler for unit cost change
 * @param {Function} props.updateMargin - Handler for margin change
 * @param {Function} props.removeProduct - Handler for removing a product
 */
const ProductTable = ({ products, billingCycle, styles, updateQty, updateUnitCost, updateMargin, removeProduct }) => {
  return (
    <div style={{ 
      backgroundColor: styles.cardBackground,
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: "30px",
      overflowX: "auto"
    }}>
      <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
        Selected Products
      </h2>
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse",
        backgroundColor: "#fff",
        tableLayout: "fixed"
      }}>
        <thead>
          <tr style={{ 
            backgroundColor: styles.tableHeaderBackground, 
            color: styles.tableHeaderText,
            textAlign: "left"
          }}>
            <th style={{ padding: "15px", fontWeight: "500", width: "15%", fontSize: "14px" }}>Product</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "20%", fontSize: "14px" }}>Description</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", fontSize: "14px" }}>License</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center", fontSize: "14px" }}>Quantity</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right", fontSize: "14px" }}>Unit Cost</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right", fontSize: "14px" }}>Unit Price</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center", fontSize: "14px" }}>Margin (%)</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right", fontSize: "14px" }}>Margin Amount</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right", fontSize: "14px" }}>Price</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center", fontSize: "14px" }}>Tax</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right", fontSize: "14px" }}>Tax Amount</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right", fontSize: "14px" }}>Total</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "9%", fontSize: "14px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            // Calculate base unit cost (before tax)
            const slab = (p.pricingSlabs || []).find(
              slab => p.qty >= slab.minQty && p.qty <= slab.maxQty
            ) || (p.pricingSlabs ? p.pricingSlabs[p.pricingSlabs.length - 1] : { unitCost: 0, margin: 0 });
            const baseUnitCost = typeof p.unitCost === 'number' ? p.unitCost : slab.unitCost;
            const margin = typeof p.margin === 'number' ? p.margin : (slab.margin || 0);
            const marginValid = margin !== null && margin !== undefined && !isNaN(margin);
            let unitPrice = '--', price = '--', marginAmount = '--', taxAmount = '--', total = '--';
            if (marginValid) {
              unitPrice = (baseUnitCost * 1.13).toFixed(2);
              price = (baseUnitCost * 1.13 * (1 + margin)).toFixed(2);
              marginAmount = ((baseUnitCost * 1.13 * margin) * p.qty).toFixed(2);
              taxAmount = (baseUnitCost * 1.13 * (1 + margin) * 0.13).toFixed(2);
              total = (baseUnitCost * 1.13 * (1 + margin) * 1.13).toFixed(2);
            }
            return (
              <tr key={p.name}>
                <td style={{ padding: "15px", color: styles.textColor, fontSize: '12px' }}>{p.name}</td>
                <td style={{ padding: "15px", color: styles.textColor, fontSize: '12px' }}>{p.description}</td>
                <td style={{ padding: "15px", color: styles.textColor, fontSize: '12px' }}>{p.license}</td>
                <td style={{ padding: "15px", textAlign: "left", minWidth: '120px', fontSize: '12px' }}>
                  <input
                    type="text"
                    className="no-spinner"
                    value={p.qty}
                    onChange={(e) => updateQty(p.name, Number(e.target.value))}
                    style={{ 
                      width: "70px",
                      padding: "10px 14px",
                      border: 'none',
                      borderRadius: "8px",
                      backgroundColor: "#fafbfc",
                      color: styles.textColor,
                      fontSize: "12px",
                      textAlign: "left",
                      margin: 0,
                      boxShadow: 'none',
                      transition: 'box-shadow 0.2s',
                    }}
                  />
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontSize: '12px' }}>
                  {`$${baseUnitCost.toFixed(2)}`}
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontSize: '12px' }}>
                  {marginValid ? `$${unitPrice}` : '--'}
                </td>
                <td style={{ padding: "15px", textAlign: "left", fontSize: '12px' }}>
                  <input
                    type="text"
                    className="no-spinner"
                    value={marginValid ? (margin * 100).toFixed(0) : ''}
                    onChange={e => {
                      const val = e.target.value.trim();
                      updateMargin(p.name, val === '' ? null : Number(val) / 100);
                    }}
                    style={{
                      width: "70px",
                      padding: "10px 14px",
                      border: 'none',
                      borderRadius: "8px",
                      backgroundColor: '#fafbfc',
                      color: styles.textColor,
                      fontSize: "12px",
                      textAlign: "left",
                      margin: 0,
                      boxShadow: 'none',
                      transition: 'box-shadow 0.2s',
                      appearance: 'none',
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                    }}
                  />
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontSize: '12px' }}>
                  {marginValid ? `$${marginAmount}` : '--'}
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontSize: '12px' }}>
                  {marginValid ? `$${price}` : '--'}
                </td>
                <td style={{ padding: "15px", textAlign: "center", fontSize: '12px' }}>
                  13%
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontSize: '12px' }}>
                  {marginValid ? `$${taxAmount}` : '--'}
                </td>
                <td style={{ padding: "15px", textAlign: "right", color: styles.textColor, fontSize: '12px' }}>
                  {marginValid ? `$${total}` : '--'}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <button
                    onClick={() => removeProduct(p.name)}
                    style={{
                      background: '#ffebee',
                      color: '#d32f2f',
                      border: 'none',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      boxShadow: '0 2px 8px rgba(211,47,47,0.07)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    title="Remove Product"
                    aria-label="Remove Product"
                  >
                    <span style={{fontWeight: 700, fontSize: '24px', lineHeight: 1}}>-</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable; 
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
            <th style={{ padding: "15px", fontWeight: "500", width: "15%" }}>Product</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "20%" }}>Description</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%" }}>License</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center" }}>Quantity</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>Unit Price</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>Price</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center" }}>Margin (%)</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>Total</th>
            <th style={{ padding: "15px", fontWeight: "500", width: "9%" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const row = calculateProductRow(p, p.qty, billingCycle);
            return (
              <tr key={p.name}>
                <td style={{ padding: "15px", color: styles.textColor }}>{row.name}</td>
                <td style={{ padding: "15px", color: styles.textColor }}>{row.description}</td>
                <td style={{ padding: "15px", color: styles.textColor }}>
                  {row.isDR
                    ? (billingCycle === 'monthly' ? 'Monthly' : 'Annual')
                    : row.license}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <input
                    type="number"
                    min={1}
                    value={row.qty}
                    onChange={(e) => updateQty(row.name, Number(e.target.value))}
                    style={{ 
                      width: "70px",
                      padding: "8px",
                      borderRadius: "6px",
                      border: `1px solid ${styles.inputBorder}`,
                      backgroundColor: "#fff",
                      color: styles.textColor,
                      fontSize: "15px",
                      textAlign: "center",
                      marginRight: '20px',
                    }}
                  />
                </td>
                <td style={{ padding: "15px", textAlign: "right" }}>
                  {row.isDR ? (
                    <input
                      type="number"
                      value={row.unitCost}
                      onChange={(e) => updateUnitCost(row.name, Number(e.target.value))}
                      style={{
                        width: "80px",
                        padding: "8px",
                        borderRadius: "6px",
                        border: `1px solid ${styles.inputBorder}`,
                        backgroundColor: "#fff",
                        color: styles.textColor,
                        fontSize: "15px",
                        textAlign: "right",
                        marginRight: '20px',
                      }}
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    `$${row.unitCost.toFixed(2)}`
                  )}
                </td>
                <td style={{ padding: "15px", textAlign: "right" }}>
                  {row.isDR ? (
                    `$${row.price.toFixed(2)}`
                  ) : (
                    `$${row.price.toFixed(2)}`
                  )}
                </td>
                <td style={{ padding: "15px", textAlign: "center" }}>
                  <input
                    type="number"
                    value={row.margin}
                    onChange={e => updateMargin(row.name, Number(e.target.value))}
                    style={{
                      width: "70px",
                      padding: "8px",
                      borderRadius: "6px",
                      border: `1px solid ${styles.inputBorder}`,
                      backgroundColor: row.isDR ? '#eee' : '#fff',
                      color: styles.textColor,
                      fontSize: "15px",
                      textAlign: "center",
                      marginRight: '20px',
                    }}
                    min="0"
                    max="100"
                    step="1"
                    disabled={row.isDR}
                    readOnly={row.isDR}
                  />
                </td>
                <td style={{ padding: "15px", textAlign: "right", color: styles.textColor }}>
                  {row.isDR ? (
                    `$${row.price.toFixed(2)}`
                  ) : (
                    `$${row.total.toFixed(2)}`
                  )}
                </td>
                <td style={{ padding: "15px" }}>
                  <button
                    onClick={() => removeProduct(row.name)}
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
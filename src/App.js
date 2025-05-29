import React, { useState, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import { PRODUCTS } from './data/products';
import { getPricingData, getPackageName, getRecommendations, formatCurrency, FINANCIAL_CONSTANTS } from './utils/pricing';
import ErrorBoundary from './components/ErrorBoundary';
import logoLightPng from './assets/et_light.png';
import Login from './components/Login';
import bgCloud from './assets/bg_cloud.png';
import logoDarkPng from './assets/et_dark.png';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#181c24" : "#f7f9fc";
  }, [darkMode]);

  // Always require login on page load
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0].name);
  const [qty, setQty] = useState(1);
  const [serviceCharge, setServiceCharge] = useState(100);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [waiveStripe, setWaiveStripe] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [salutation, setSalutation] = useState("Mr.");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showIn, setShowIn] = useState('selling');
  const [canTime, setCanTime] = useState(new Date());
  const [indTime, setIndTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCanTime(new Date());
      setIndTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canTimeString = canTime.toLocaleTimeString('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const indTimeString = indTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleQtyWheel = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const validateInput = useCallback((value, type) => {
    switch (type) {
      case 'quantity':
        return Number.isInteger(Number(value)) && value > 0;
      case 'serviceCharge':
        return !isNaN(value) && value >= 0;
      case 'customerName':
        return value.trim().length > 0;
      default:
        return true;
    }
  }, []);

  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    if (validateInput(value, 'customerName')) {
      setCustomerName(value);
    }
  };

  const addProduct = useCallback(() => {
    try {
      if (!validateInput(qty, 'quantity')) {
        throw new Error("Quantity must be a positive integer");
      }
      const product = PRODUCTS.find(p => p.name === selectedProduct);
      if (!product) {
        throw new Error("Selected product not found");
      }
      setProducts(prev => {
        const existingProduct = prev.find(p => p.name === selectedProduct);
        if (existingProduct) {
          return prev.map(p =>
            p.name === selectedProduct ? { ...p, qty: p.qty + qty } : p
          );
        }
        return [...prev, { ...product, qty }];
      });
    } catch (error) {
      console.error('Error adding product:', error);
      alert(error.message);
    }
  }, [selectedProduct, qty, validateInput]);

  const removeProduct = useCallback((name) => {
    setProducts(prev => prev.filter(p => p.name !== name));
  }, []);

  const updateQty = useCallback((name, newQty) => {
    try {
      if (!validateInput(newQty, 'quantity')) {
        throw new Error("Quantity must be a positive integer");
      }
      setProducts(prev =>
        prev.map(p => (p.name === name ? { ...p, qty: Number(newQty) } : p))
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(error.message);
    }
  }, [validateInput]);

  const updateMargin = (name, newMargin) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.name === name) {
          const updatedSlabs = p.pricingSlabs.map(slab => ({
            ...slab,
            margin: newMargin,
            recommendedPrice: slab.unitCost * (1 + newMargin / 100)
          }));
          return { ...p, pricingSlabs: updatedSlabs };
        }
        return p;
      })
    );
  };

  const styles = darkMode
    ? {
        backgroundColor: "#181c24",
        textColor: "#f5f6fa",
        primaryColor: "#6cb8ff",
        secondaryColor: "#7fd7c4",
        cardBackground: "#232a36",
        borderColor: "#2a3140",
        tableHeaderBackground: "#1976d2",
        tableHeaderText: "#f5f6fa",
        buttonBackground: "#1976d2",
        buttonText: "#f5f6fa",
        removeButtonBackground: "#e57373",
        inputBorder: "#3a4256",
        hoverBackground: "#232a36",
        overlay: "linear-gradient(120deg, rgba(24,28,36,0.92) 60%, rgba(30,40,60,0.85) 100%)",
      }
    : {
        backgroundColor: "#f7f9fc",
        textColor: "#333333",
        primaryColor: "#1e88e5",
        secondaryColor: "#ff6d00",
        cardBackground: "#ffffff",
        borderColor: "#e0e0e0",
        tableHeaderBackground: "#1e88e5",
        tableHeaderText: "#ffffff",
        buttonBackground: "#1e88e5",
        buttonText: "#ffffff",
        removeButtonBackground: "#f44336",
        inputBorder: "#bdbdbd",
        hoverBackground: "#f5f5f5",
        overlay: "none",
      };

  useEffect(() => {
    document.body.style.background = darkMode
      ? `${styles.overlay}, url(${bgCloud}) center center/cover no-repeat fixed`
      : styles.backgroundColor;
  }, [darkMode, styles.overlay, styles.backgroundColor]);

  if (!authenticated) {
    return <Login onLogin={() => {
      setAuthenticated(true);
      localStorage.setItem('authenticated', 'true');
    }} />;
  }

  const billingMultiplier = billingCycle === "annual" ? 12 : 1;

  const pax8Subtotal = products.reduce((sum, p) => {
    const pricingData = getPricingData(p, p.qty);
    return sum + pricingData.unitCost * p.qty;
  }, 0);

  const pax8Total = pax8Subtotal * 1.13 * billingMultiplier;

  const customerSubtotal = products.reduce((sum, p) => {
    const pricingData = getPricingData(p, p.qty);
    return sum + pricingData.recommendedPrice * p.qty;
  }, 0) * billingMultiplier;

  const proFeeMonthly = serviceCharge / 12;
  const proFeeForCalc = billingCycle === "monthly" ? proFeeMonthly : serviceCharge;

  const taxOnCustomer = (customerSubtotal + proFeeForCalc) * 0.13;

  const stripeBase = customerSubtotal + proFeeForCalc + taxOnCustomer;
  const stripeFee = waiveStripe ? 0 : stripeBase * 0.0299 + 0.30;

  const finalTotal = stripeBase + stripeFee;

  const profitBeforeTax = customerSubtotal - (pax8Subtotal * billingMultiplier) + 
                         (billingCycle === "monthly" ? proFeeMonthly : serviceCharge);
  const profitAfterTax = profitBeforeTax * 0.87 - (waiveStripe ? 0 : stripeFee);

  const productsWithCalc = products.map(p => {
    const pricingData = getPricingData(p, p.qty);
    return {
      ...p,
      unitCost: pricingData.unitCost,
      recommendedPrice: pricingData.recommendedPrice,
      margin: pricingData.margin,
      lineTotal: pricingData.recommendedPrice * p.qty * billingMultiplier * 1.13
    };
  });

  const recommendations = getRecommendations(products, serviceCharge, billingCycle, profitBeforeTax);

  const validateQuoteGeneration = () => {
    if (!customerName.trim()) {
      setValidationError("Please enter customer name");
      return false;
    }
    if (products.length === 0) {
      setValidationError("Please add at least one product");
      return false;
    }
    if (serviceCharge < 0) {
      setValidationError("Service charge cannot be negative");
      return false;
    }
    setValidationError("");
    return true;
  };

  const generatePDF = async () => {
    if (!validateQuoteGeneration()) {
      return;
    }
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      // Add PNG logo at the top left
      const img = new Image();
      img.src = logoLightPng;
      doc.addImage(img.src, 'PNG', 14, 10, 45, 9);
      // Add more vertical space before company details
      let headerY = 10 + 9 + 12; // logo Y + logo height + extra space
      doc.setFontSize(10);
      doc.setTextColor(100);
      const companyDetails = [
        "Ontario, Canada",
        "289-291-6377",
        "info@excelytech.com"
      ];
      companyDetails.forEach(line => {
        doc.text(line, 14, headerY);
        headerY += 5;
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(14, headerY, 196, headerY);
      headerY += 5;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Quote Date: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 14, headerY);
      doc.text(`Quote #: ${Math.floor(1000 + Math.random() * 9000)}`, 14, headerY + 6);
      const preparedFor = `Prepared for: ${customerName || "Customer"}`;
      doc.text(preparedFor, 14, headerY + 12);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text("**Quote Valid for 30 Days**", 140, headerY + 12);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      const greeting = `${salutation} ${customerName || "Customer"},`;
      doc.text(greeting, 14, headerY + 46);
      
      doc.setFontSize(11);
      const introText = [
        "Thank you for choosing ExcelyTech for your backup and security needs. We are pleased to present this detailed quote for our services, tailored to meet your requirements. Below, you will find a comprehensive breakdown of your proposed solution:"
      ];
      let currentY = headerY + 56;
      introText.forEach(line => {
        const splitText = doc.splitTextToSize(line, 180);
        doc.text(splitText, 14, currentY);
        currentY += splitText.length * 4.5;
      });

      doc.setFontSize(14);
      doc.setTextColor(33, 150, 243);
      const quoteSummary = `Quote Summary: ${getPackageName(products)}`;
      doc.text(quoteSummary, 14, currentY + 6);
      currentY += 12;
      doc.setTextColor(0);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      const billingText = `Billing Cycle: ${billingCycle === 'monthly' ? 
        'Monthly subscription - You will be charged this amount every month' : 
        'Annual subscription - You will be charged this amount once per year'}`;
      const splitBilling = doc.splitTextToSize(billingText, 180);
      doc.text(splitBilling, 14, currentY);
      currentY += splitBilling.length * 4.5;

      const tableColumn = ["Product Name", "Description", "Qty", "Price", "Total"];
      const productRows = products.map(p => [
        p.name,
        p.description,
        p.qty.toString(),
        `$${getPricingData(p, p.qty).recommendedPrice.toFixed(2)}`,
        `$${(getPricingData(p, p.qty).recommendedPrice * p.qty * billingMultiplier).toFixed(2)}`
      ]);

      const additionalRows = [
        [
          {
            content: "Implementation & Support",
            colSpan: 2
          },
          "1",
          `$${proFeeForCalc.toFixed(2)}`,
          `$${proFeeForCalc.toFixed(2)}`
        ],
        [
          {
            content: "Tax (13% HST)",
            colSpan: 2
          },
          "",
          "",
          `$${taxOnCustomer.toFixed(2)}`
        ],
        [
          {
            content: `Payment Processing${waiveStripe ? " waived" : ""}`,
            colSpan: 2
          },
          "",
          "",
          `$${stripeFee.toFixed(2)}`
        ]
      ];

      const totalRow = [
        {
          content: `TOTAL (${billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Charge)`,
          colSpan: 3,
          styles: { fontStyle: 'bold' }
        },
        "",
        `$${finalTotal.toFixed(2)}`
      ];

      autoTable(doc, {
        startY: currentY + 2,
        head: [tableColumn],
        body: [...productRows, ...additionalRows, totalRow],
        styles: { 
          font: "helvetica",
          fontSize: 10,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: { 
          fillColor: [25, 118, 210],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        columnStyles: {
          0: { cellWidth: 48, halign: 'left' }, // Product Name
          1: { cellWidth: 48, halign: 'left' }, // Description
          2: { cellWidth: 18, halign: 'center' }, // Qty
          3: { cellWidth: 28, halign: 'center' }, // Price
          4: { cellWidth: 28, halign: 'center' }, // Total
        },
        didParseCell: (data) => {
          if (data.row.index === productRows.length + additionalRows.length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [245, 245, 245];
          }
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.setTextColor(100);
      
      doc.text("Terms & Conditions:", 14, currentY);
      const terms = [
        "1. Validity: This quote is valid for 30 days from the date of issue. Prices are subject to change thereafter.",
        `2. Payment Terms: Invoices are due within 15 days of receipt. ${billingCycle === 'monthly' ? 
          'Monthly subscriptions will be automatically charged on the 1st of each month.' : 
          'Annual subscriptions require full payment upfront within 15 days of invoice receipt.'}`,
        "3. Service Commencement: Services will commence upon receipt of signed agreement and initial payment.",
        "4. Cancellation Policy: Subscriptions may be canceled with 30 days' written notice. No refunds will be issued for partial terms.",
        "5. Limitation of Liability: ExcelyTech shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.",
        "6. Governing Law: This agreement shall be governed by the laws of Ontario, Canada."
      ];
      currentY += 6;
      terms.forEach((term) => {
        const splitText = doc.splitTextToSize(term, 180);
        doc.text(splitText, 14, currentY);
        currentY += splitText.length * 4.5;
      });

      const pageHeight = doc.internal.pageSize.height;
      let footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = "Confidential - This document contains proprietary information and is intended solely for the recipient.";
      const splitFooter = doc.splitTextToSize(footerText, 180);
      doc.text(splitFooter, 14, footerY);

      doc.addPage();
      currentY = 20;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Key Terms and Conditions:", 14, currentY);
      const msaTerms = [
        "1. Quote Definition: This Product Quotation outlines the costs and terms for Products/Services, forming part of the Master Agreement.",
        "2. Payment: Fees are due monthly on the 1st via direct debit; late fees apply. Hardware/software must be paid before deployment. Fees may increase after 12 months (up to 10% annually with 60 days' notice).",
        "3. Term: The agreement lasts 36 months, auto-renewing yearly unless terminated with 60 days' notice.",
        "4. Termination/Cancellation: Early termination incurs remaining fees; Product cancellation incurs a 15% restocking fee (no returns for delivered/custom items).",
        "5. Confidentiality: Quote details are confidential and must not be disclosed.",
        "6. Warranties: Product warranties are passed on; out-of-warranty support requires a separate quote.",
        "7. Additional Costs: Costs (hourly, after-hours, agreement rates) and additional services are defined in the Product Quotation."
      ];
      currentY += 6;
      msaTerms.forEach((term) => {
        const splitText = doc.splitTextToSize(term, 180);
        doc.text(splitText, 14, currentY);
        currentY += splitText.length * 4.5;
      });

      currentY += 10;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text("Acceptance:", 14, currentY);
      currentY += 6;
      doc.text("Customer Signature: _______________________________", 14, currentY);
      doc.text("Date: ________________", 140, currentY);
      currentY += 10;
      doc.text("ExcelyTech Representative: _______________________", 14, currentY);
      doc.text("Date: ________________", 140, currentY);

      currentY += 15;
      doc.setTextColor(25, 118, 210);
      const appreciationText = "We appreciate your business!";
      doc.text(appreciationText, 14, currentY);
      doc.setTextColor(100);
      const contactText = [
        "Ontario, Canada",
        "289-291-6377",
        "info@excelytech.com"
      ];
      currentY += 6;
      contactText.forEach((line) => {
        const splitText = doc.splitTextToSize(line, 180);
        doc.text(splitText, 14, currentY);
        currentY += splitText.length * 4.5;
      });

      footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(splitFooter, 14, footerY);

      // Generate QR code with summary info
      const qrText = `Customer: ${customerName || 'N/A'}\nCompany: ${customerCompany || 'N/A'}\nTotal: $${finalTotal.toFixed(2)} CAD\nDate: ${new Date().toLocaleDateString('en-CA')}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { width: 80, margin: 1 });
      // Place QR code just above the footer, smaller size
      const qrSize = 36;
      const pageWidth = doc.internal.pageSize.getWidth();
      const firstPageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(qrDataUrl, 'PNG', pageWidth - qrSize - 30, firstPageHeight - qrSize - 70, qrSize, qrSize);

      doc.save(`ExcelyTech-Quote-${customerName || "Customer"}-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).replace(/\//g, '-')}.pdf`);
      setIsGeneratingPDF(false);
    } catch (err) {
      setValidationError('PDF generation failed: ' + (err.message || err.toString()));
      setIsGeneratingPDF(false);
    }
  };

  // Check if any product margin is below 20%
  const hasLowMargin = products.some(p => {
    const pricingData = getPricingData(p, p.qty);
    return pricingData.margin < 20;
  });

  return (
    <ErrorBoundary>
      <div
        style={{
          maxWidth: "1200px",
          margin: "30px auto",
          fontFamily: "'Roboto', sans-serif",
          padding: "0 20px",
          backgroundColor: styles.backgroundColor,
          color: styles.textColor,
          minHeight: "100vh",
          transition: 'background 0.3s, color 0.3s',
          marginTop: '70px',
        }}
      >
        {/* Top-right button group */}
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 100,
            display: 'flex',
            gap: '10px',
          }}
        >
          {/* Logout button (icon only) */}
          <button
            onClick={() => {
              setAuthenticated(false);
              localStorage.removeItem('authenticated');
            }}
            style={{
              background: styles.removeButtonBackground,
              color: styles.buttonText,
              border: 'none',
              borderRadius: '50%',
              padding: '10px',
              fontSize: '1.3rem',
              width: '44px',
              height: '44px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Logout"
          >
            <span style={{fontSize: '22px'}}>⎋</span>
          </button>
          {/* Dark/Light mode toggle button */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            style={{
              background: styles.buttonBackground,
              color: styles.buttonText,
              border: 'none',
              borderRadius: '50%',
              padding: '10px',
              fontSize: '1.3rem',
              width: '44px',
              height: '44px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        {/* Global dark mode field styles */}
        {darkMode && (
          <style>{`
            input, select, textarea {
              background: #232a36 !important;
              color: #f5f6fa !important;
              border: 1.5px solid #3a4256 !important;
            }
            input::placeholder, textarea::placeholder {
              color: #7a8ca7 !important;
              opacity: 1 !important;
            }
            select:disabled, input:disabled, textarea:disabled {
              background: #232a36 !important;
              color: #888 !important;
            }
            .card, .panel, .table, .summary {
              background: #232a36 !important;
              color: #f5f6fa !important;
              border: 1.5px solid #2a3140 !important;
            }
            th, td {
              color: #f5f6fa !important;
            }
            button {
              font-family: 'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif !important;
            }
          `}</style>
        )}
        <div style={{
          position: 'relative',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            padding: '15px',
            backgroundColor: styles.cardBackground,
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={darkMode ? logoDarkPng : logoLightPng} 
                alt="ExcelyTech Logo" 
                style={{ height: '44px', width: 'auto', borderRadius: '4px', background: 'transparent' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: styles.primaryColor, letterSpacing: '1px' }}>CAN</span>
                <span style={{ fontSize: '15px', fontFamily: 'monospace', marginTop: '2px', color: '#333' }}>{canTimeString}</span>
              </div>
              <div style={{ width: '1px', height: '28px', background: '#e0e0e0', borderRadius: '1px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: styles.primaryColor, letterSpacing: '1px' }}>IND</span>
                <span style={{ fontSize: '15px', fontFamily: 'monospace', marginTop: '2px', color: '#333' }}>{indTimeString}</span>
              </div>
            </div>
          </div>

          {products.length > 0 && (
            <div style={{
              backgroundColor: styles.cardBackground,
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "30px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              textAlign: "center"
            }}>
              <div>
                <h3 style={{ margin: "0 0 10px", color: styles.textColor, fontSize: "18px" }}>
                  Final Total
                </h3>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: styles.primaryColor }}>
                  ${finalTotal.toFixed(2)} CAD
                </p>
                <p style={{ margin: "5px 0 0", fontSize: "14px", color: "#666" }}>
                  {billingCycle === "annual" ? "per year" : "per month"}
                </p>
              </div>
              <div>
                <h3 style={{ margin: "0 0 10px", color: styles.textColor, fontSize: "18px" }}>
                  Estimated Profit
                </h3>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: styles.secondaryColor }}>
                  ${profitAfterTax.toFixed(2)}
                </p>
                <p style={{ margin: "5px 0 0", fontSize: "14px", color: "#666" }}>
                  After Tax ({billingCycle === "annual" ? "per year" : "per month"})
                </p>
              </div>
              <div>
                <h3 style={{ margin: "0 0 10px", color: styles.textColor, fontSize: "18px" }}>
                  Package
                </h3>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: styles.textColor }}>
                  {getPackageName(products)}
                </p>
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: styles.cardBackground,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '30px',
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
              Customer Information
            </h2>
            <div className="customer-info-grid">
              <div className="customer-info-field">
                <label className="customer-info-label">
                  Salutation
                  <span className="customer-info-tooltip" title="Select the appropriate salutation for the customer">
                    ⓘ
                  </span>
                </label>
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="customer-info-input"
                >
                  <option>Mr.</option>
                  <option>Ms.</option>
                  <option>Mrs.</option>
                  <option>Miss</option>
                  <option>Dr.</option>
                  <option>Dear</option>
                </select>
              </div>
              <div className="customer-info-field">
                <label className="customer-info-label">
                  Customer Name
                  <span className="customer-info-tooltip" title="Enter the full name of the customer">
                    ⓘ
                  </span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="customer-info-input"
                  placeholder="Enter customer name"
                />
              </div>
              <div className="customer-info-field">
                <label className="customer-info-label">
                  Company
                  <span className="customer-info-tooltip" title="Enter the customer's company name">
                    ⓘ
                  </span>
                </label>
                <input
                  type="text"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="customer-info-input"
                  placeholder="Enter company name"
                />
              </div>
              <div className="customer-info-field">
                <label className="customer-info-label">
                  Email
                  <span className="customer-info-tooltip" title="Enter the customer's email address">
                    ⓘ
                  </span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="customer-info-input"
                  placeholder="Enter customer email"
                />
              </div>
              <div className="customer-info-field">
                <label className="customer-info-label">
                  Phone
                  <span className="customer-info-tooltip" title="Enter the customer's phone number">
                    ⓘ
                  </span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="customer-info-input"
                  placeholder="Enter customer phone"
                />
              </div>
              <div className="customer-info-field">
                <label className="customer-info-label">
                  Address
                  <span className="customer-info-tooltip" title="Enter the customer's address">
                    ⓘ
                  </span>
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="customer-info-input"
                  placeholder="Enter customer address"
                />
              </div>
            </div>
          </div>
          <div style={{ 
            backgroundColor: styles.cardBackground,
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
              Add Product
            </h2>
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "20px",
              alignItems: "flex-end"
            }}>
              <div style={{ flex: "1 1 250px", minWidth: "200px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "500",
                  color: styles.textColor 
                }}>
                  Product
                  <span style={{ marginLeft: "5px", color: "#666", fontSize: "14px", cursor: "pointer" }} title="Select a product to add to the quote">
                    ⓘ
                  </span>
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ 
                    padding: "10px", 
                    width: "100%",
                    borderRadius: "6px",
                    border: `1px solid ${styles.inputBorder}`,
                    backgroundColor: "#fff",
                    color: styles.textColor,
                    fontSize: "16px"
                  }}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "flex-end", 
                gap: "15px",
                flex: "0 0 auto"
              }}>
                <div style={{ flex: "0 0 80px" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "500",
                    color: styles.textColor 
                  }}>
                    Quantity
                    <span style={{ marginLeft: "5px", color: "#666", fontSize: "14px", cursor: "pointer" }} title="Enter the number of units for this product">
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    onWheel={handleQtyWheel}
                    style={{ 
                      padding: "10px", 
                      width: "80px",
                      borderRadius: "6px",
                      border: `1px solid ${styles.inputBorder}`,
                      backgroundColor: "#fff",
                      color: styles.textColor,
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ flex: "0 0 80px" }}>
                  <button 
                    onClick={addProduct}
                    style={{ 
                      padding: "10px",
                      width: "80px",
                      backgroundColor: styles.buttonBackground,
                      color: styles.buttonText,
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "background-color 0.2s",
                      marginTop: "32px"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1565c0"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.buttonBackground}
                  >
                    <span style={{ fontSize: "18px" }}>+</span> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {products.length > 0 && (
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
                    <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>Unit Cost</th>
                    <th style={{ padding: "15px", fontWeight: "500", width: "8%", textAlign: "center" }}>Margin (%)</th>
                    <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>Price</th>
                    <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>Total</th>
                    <th style={{ padding: "15px", fontWeight: "500", width: "9%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsWithCalc.map((p) => (
                    <tr 
                      key={p.name} 
                      style={{ 
                        borderBottom: `1px solid ${styles.borderColor}`,
                        transition: "background-color 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.hoverBackground}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                    >
                      <td style={{ padding: "15px", color: styles.textColor }}>{p.name}</td>
                      <td style={{ padding: "15px", color: styles.textColor }}>{p.description}</td>
                      <td style={{ padding: "15px", color: styles.textColor }}>{p.license}</td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <input
                          type="number"
                          min={1}
                          value={p.qty}
                          onChange={(e) => updateQty(p.name, Number(e.target.value))}
                          onWheel={handleQtyWheel}
                          style={{ 
                            width: "70px",
                            padding: "8px",
                            borderRadius: "6px",
                            border: `1px solid ${styles.inputBorder}`,
                            backgroundColor: "#fff",
                            color: styles.textColor,
                            fontSize: "16px",
                            textAlign: "center"
                          }}
                        />
                      </td>
                      <td style={{ padding: "15px", textAlign: "right", color: styles.textColor }}>
                        ${p.unitCost.toFixed(2)}
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <input
                          type="number"
                          value={p.margin}
                          onChange={(e) => updateMargin(p.name, Number(e.target.value))}
                          style={{ 
                            width: "70px",
                            padding: "8px",
                            borderRadius: "6px",
                            border: `1px solid ${styles.inputBorder}`,
                            backgroundColor: "#fff",
                            color: styles.textColor,
                            fontSize: "16px",
                            textAlign: "center"
                          }}
                          min="0"
                          max="100"
                          step="1"
                        />
                      </td>
                      <td style={{ padding: "15px", textAlign: "right", color: styles.textColor }}>
                        ${p.recommendedPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: "15px", textAlign: "right", color: styles.textColor }}>
                        ${p.lineTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: "15px" }}>
                        <button 
                          onClick={() => removeProduct(p.name)}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: styles.removeButtonBackground,
                            color: styles.buttonText,
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "background-color 0.2s",
                            width: "100%",
                            justifyContent: "center"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#d32f2f"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.removeButtonBackground}
                        >
                          <span style={{ fontSize: "18px" }}>-</span> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ 
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
            marginBottom: 0,
            alignItems: "stretch"
          }}>
            <div style={{ 
              backgroundColor: styles.cardBackground,
              padding: "32px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              minHeight: '480px'
            }}>
              <h2 style={{ margin: "0 0 10px", fontSize: "20px", color: styles.primaryColor }}>
                Price Configuration
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ 
                  fontWeight: "500",
                  color: styles.textColor,
                  marginBottom: "4px"
                }}>
                  Professional Services & Support
                  <span style={{ marginLeft: "5px", color: "#666", fontSize: "14px", cursor: "pointer" }} title="Enter the one-time fee for implementation and support">
                    ⓘ
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '100%', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min={0}
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(Number(e.target.value))}
                    style={{ 
                      padding: "12px 14px", 
                      width: "120px",
                      borderRadius: "8px",
                      border: `1.5px solid ${styles.inputBorder}`,
                      backgroundColor: darkMode ? "#232a36" : "#f8fafc",
                      color: styles.textColor,
                      fontSize: "16px",
                      boxSizing: "border-box",
                      marginBottom: "2px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}
                  />
                  <span style={{ color: '#555', fontWeight: 500, fontSize: '15px' }}>CAD</span>
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginLeft: '10px',
                    border: '1px solid #bbdefb',
                    maxWidth: '320px',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    flex: '1 1 220px',
                    minWidth: '120px',
                    boxSizing: 'border-box',
                    display: 'inline-block',
                    textAlign: 'center',
                    marginTop: '6px'
                  }}>
                    Enter the total amount for implementation and support for the entire year.
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ 
                  fontWeight: "500",
                  color: styles.textColor,
                  marginBottom: "4px"
                }}>
                  Billing Cycle
                  <span style={{ marginLeft: "5px", color: "#666", fontSize: "14px", cursor: "pointer" }} title="Choose between monthly or annual billing">
                    ⓘ
                  </span>
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  style={{ 
                    padding: "12px 14px", 
                    width: "100%",
                    borderRadius: "8px",
                    border: `1.5px solid ${styles.inputBorder}`,
                    backgroundColor: darkMode ? "#232a36" : "#f8fafc",
                    color: styles.textColor,
                    fontSize: "16px",
                    boxSizing: "border-box",
                    marginBottom: "2px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <h3 style={{ margin: "18px 0 0 0", fontSize: "18px", color: styles.primaryColor }}>
                Business Growth Suggestions
              </h3>
              <ul style={{ paddingLeft: "20px", margin: 0, color: "#555", listStyleType: "none" }}>
                {recommendations.map((rec, index) => (
                  <li key={index} style={{ 
                    marginBottom: "12px", 
                    fontSize: "15px", 
                    position: "relative",
                    paddingLeft: "25px"
                  }}>
                    <span style={{
                      position: "absolute",
                      left: 0,
                      top: "3px",
                      color: styles.secondaryColor,
                      fontSize: "18px"
                    }}>
                      •
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ 
              backgroundColor: hasLowMargin ? '#ffeaea' : styles.cardBackground,
              border: hasLowMargin ? '2px solid #d32f2f' : undefined,
              color: hasLowMargin ? '#d32f2f' : styles.textColor,
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              minHeight: '480px'
            }}>
              <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
                Financial Summary
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Our Cost to Pax8 (incl. 13% tax):
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${pax8Total.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Customer Amount (Before Tax):
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${customerSubtotal.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Professional Services & Support:
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${proFeeForCalc.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Tax (13% HST):
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${taxOnCustomer.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Payment Processing Fee:
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${stripeFee.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "bold", color: styles.primaryColor }}>
                      Customer Total (Before Payment Processing Fee):
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold", color: styles.primaryColor }}>
                      ${ (customerSubtotal + proFeeForCalc + taxOnCustomer).toFixed(2) } CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Estimated Profit Before Tax:
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${profitBeforeTax.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 0", fontWeight: "500", color: styles.textColor }}>
                      Estimated Profit After Tax:
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold", color: '#2e7d32' }}>
                      ${profitAfterTax.toFixed(2)} CAD
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "40px", marginBottom: "40px" }}>
          {validationError && (
            <div style={{
              color: '#fff',
              background: '#d32f2f',
              padding: '14px 24px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontWeight: 600,
              fontSize: '1.1rem',
              display: 'inline-block',
              boxShadow: '0 2px 8px rgba(211,47,47,0.12)'
            }}>
              {validationError}
            </div>
          )}
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            style={{
              backgroundColor: isGeneratingPDF ? "#90a4ae" : styles.buttonBackground,
              color: styles.buttonText,
              border: "none",
              padding: "16px 48px",
              fontSize: "20px",
              fontWeight: "600",
              cursor: isGeneratingPDF ? "not-allowed" : "pointer",
              borderRadius: "8px",
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              transition: "background-color 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px"
            }}
            onMouseOver={e => {
              if (!isGeneratingPDF) e.currentTarget.style.backgroundColor = "#1565c0";
            }}
            onMouseOut={e => {
              if (!isGeneratingPDF) e.currentTarget.style.backgroundColor = styles.buttonBackground;
            }}
          >
            {isGeneratingPDF ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Generating...
              </>
            ) : (
              <>
                <span style={{ fontSize: "22px" }}>📄</span>
                Generate Quote PDF
              </>
            )}
          </button>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .customer-info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 28px 24px;
              margin-bottom: 10px;
            }
            .customer-info-field {
              background: #f7f9fc;
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(30,136,229,0.07);
              padding: 18px 16px 12px 16px;
              display: flex;
              flex-direction: column;
              min-width: 0;
            }
            .customer-info-label {
              font-weight: 700;
              color: #1e88e5;
              margin-bottom: 8px;
              font-size: 1.08rem;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .customer-info-tooltip {
              color: #666;
              font-size: 14px;
              cursor: pointer;
              margin-left: 4px;
            }
            .customer-info-input {
              padding: 12px 10px;
              border-radius: 6px;
              border: 1.5px solid #bdbdbd;
              background: #fff;
              color: #222;
              font-size: 1.08rem;
              font-family: inherit;
              margin-top: 2px;
              transition: border 0.2s;
            }
            .customer-info-input:focus {
              border: 1.5px solid #1e88e5;
              outline: none;
            }
            @media (max-width: 1200px) {
              .customer-info-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            @media (max-width: 700px) {
              .customer-info-grid {
                grid-template-columns: 1fr;
              }
            }
          `}
        </style>
      </div>
    </ErrorBoundary>
  );
}
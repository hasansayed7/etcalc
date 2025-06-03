import React, { useState, useCallback, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import { PRODUCTS } from './data/products';
import { getPricingData, getPackageName, getRecommendations, generateEmailSubject, calculateProductRow } from './utils/pricing';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import bgCloud from './assets/bg_cloud.png';
import Notification from './components/Notification';
import { sendEmail } from './utils/emailService';
import emailjs from '@emailjs/browser';
import logoPng from './assets/et_dark.png';
import ProductTable from './components/ProductTable';

// Replace EXCELYTECH_LOGO with base64 string
const EXCELYTECH_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtbC4uLg=='; // <-- Replace with your actual base64 string

// Helper to fetch image as Data URL
async function getImageDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0].name);
  const [qty, setQty] = useState(1);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [waiveStripe, setWaiveStripe] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [salutation, setSalutation] = useState("Mr.");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationKey, setNotificationKey] = useState(0);
  const [customProducts, setCustomProducts] = useState([]);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', license: '', unitCost: 0, margin: 35 });
  const [validationError, setValidationError] = useState("");
  const [canTime, setCanTime] = useState(new Date());
  const [indTime, setIndTime] = useState(new Date());
  const [usTime, setUsTime] = useState(new Date());
  // 1. Add card type selector state
  const [cardType, setCardType] = useState('domestic'); // 'domestic' or 'international'

  // 1. Make margin thresholds configurable
  const [productMarginThreshold, setProductMarginThreshold] = useState(20); // default 20%
  const [packageMarginThreshold, setPackageMarginThreshold] = useState(15); // default 15%

  // Memoize allProducts
  const allProducts = useMemo(() => {
    return [...PRODUCTS, ...customProducts];
  }, [PRODUCTS, customProducts]);

  // Calculate billing multiplier
  const billingMultiplier = billingCycle === "annual" ? 12 : 1;

  // Calculate pro fee
  const proFeeMonthly = serviceCharge / 12;
  const proFeeForCalc = billingCycle === "monthly" ? proFeeMonthly : serviceCharge;

  // Memoize calculations
  const calculations = useMemo(() => {
    const validProducts = products.filter(p => {
      const slab = (p.pricingSlabs || [])[0];
      const margin = slab && typeof slab.margin === 'number' ? slab.margin : null;
      return margin !== null && !isNaN(margin) && margin >= 0.2;
    });
    const subtotal = validProducts.reduce((sum, p) => {
      const pricingData = getPricingData(p, p.qty);
      return sum + pricingData.recommendedPrice * p.qty;
    }, 0) * billingMultiplier;

    const tax = (subtotal + proFeeForCalc) * 0.13;
    const stripeBase = subtotal + proFeeForCalc + tax;
    const stripeFee = waiveStripe ? 0 : (stripeBase * 0.029 + 0.30);
    const total = stripeBase + stripeFee;

    return {
      subtotal,
      tax,
      stripeFee,
      total,
      stripeBase
    };
  }, [products, billingMultiplier, proFeeForCalc, waiveStripe]);

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#181c24" : "#f7f9fc";
  }, [darkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCanTime(new Date());
      setIndTime(new Date());
      setUsTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Remove unused canTimeString since we're using usCanTime
  const indTimeString = indTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
  const usTimeString = usTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Always display only one time for US EST / CAN, using US EST time
  const usCanLabel = 'US EST / CAN';
  const usCanTime = usTimeString;

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

  // Use handleCustomerNameChange in the input field
  const handleCustomerNameChange = (e) => {
    const value = e.target.value;
    if (validateInput(value, 'customerName')) {
      setCustomerName(value);
      setValidationError("");
    } else {
      setValidationError("Please enter a valid name");
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setCustomerEmail(value);
    if (value && !validateEmail(value)) {
      setValidationError("Please enter a valid email address");
    } else {
      setValidationError("");
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setCustomerPhone(value);
    if (value && !validatePhone(value)) {
      setValidationError("Please enter a valid phone number");
    } else {
      setValidationError("");
    }
  };

  const addProduct = useCallback(() => {
    try {
      if (!validateInput(qty, 'quantity')) {
        throw new Error("Quantity must be a positive integer");
      }
      const product = allProducts.find(p => p.name === selectedProduct);
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
      showNotification(error.message);
    }
  }, [selectedProduct, qty, validateInput, allProducts]);

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
      showNotification(error.message);
    }
  }, [validateInput]);

  const updateMargin = (name, newMargin) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.name === name) {
          // If blank or invalid, set margin to null
          const marginValue = (newMargin === null || newMargin === undefined || isNaN(newMargin)) ? null : newMargin;
          const updatedSlabs = p.pricingSlabs.map(slab => ({
            ...slab,
            margin: marginValue,
            recommendedPrice: slab.unitCost * (1 + (marginValue || 0))
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

  // Move this block above any early returns (such as if (!authenticated) ...)
  const productsWithCalc = useMemo(() => products.map(p => {
    const pricingData = getPricingData(p, p.qty);
    const isDR = p.isHomeGrown;
    let drPrice = pricingData.recommendedPrice; // Already includes tax for DR products
    if (isDR && billingCycle === 'monthly') {
      drPrice = drPrice / 12; // Monthly billing for DR products
    }

    return {
      ...p,
      unitCost: pricingData.unitCost,
      recommendedPrice: isDR ? drPrice : pricingData.recommendedPrice,
      margin: pricingData.margin,
      lineTotal: isDR 
        ? drPrice // Display same value as Price for DR products
        : pricingData.recommendedPrice * p.qty * billingMultiplier
    };
  }), [products, billingCycle, billingMultiplier]);

  // Cost to Pax8 (manually input or calculated)
  const pax8Total = productsWithCalc
    .filter(p => !p.isHomeGrown)
    .reduce((sum, p) => sum + (p.unitCost * p.qty), 0);

  // Customer Amount (Before Tax)
  const customerSubtotal = products.reduce((sum, p) => {
    const row = calculateProductRow(p, p.qty, billingCycle);
    return sum + row.total;
  }, 0);

  // Tax (13% HST)
  const taxOnCustomer = isNaN(customerSubtotal) ? 0 : customerSubtotal * 0.13;

  // Payment Processing Fee (only if Customer Total > 0)
  const customerTotalBeforeFee = customerSubtotal + taxOnCustomer;
  const stripeFee = customerTotalBeforeFee > 0 ? 0.30 : 0;

  // Final Customer Total
  const finalCustomerTotal = customerTotalBeforeFee - stripeFee;

  // Profit Calculations
  const profitBeforeTax = customerTotalBeforeFee - (pax8Total + proFeeForCalc + stripeFee);
  const profitTaxRate = 0.13; // 13% profit tax if applicable
  const profitAfterTax = profitBeforeTax * (1 - profitTaxRate);

  const recommendations = getRecommendations(
    products.filter(p => {
      const slab = (p.pricingSlabs || [])[0];
      const margin = slab && typeof slab.margin === 'number' ? slab.margin : null;
      return margin !== null && !isNaN(margin) && margin >= 0.2;
    }),
    serviceCharge,
    billingCycle,
    profitBeforeTax
  );

  const showNotification = (message) => {
    setNotification(message);
    setNotificationKey(prev => prev + 1);
    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const validateQuoteGeneration = () => {
    if (!customerName.trim()) {
      showNotification("Please enter customer name");
      return false;
    }
    if (products.length === 0) {
      showNotification("Please add at least one product");
      return false;
    }
    return true;
  };

  const generatePDF = async () => {
    try {
      if (!validateQuoteGeneration()) {
        return;
      }
  
      setIsGeneratingPDF(true);
      setValidationError("");
  
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
  
      // Add PNG logo at the top left
      const logoDataUrl = await getImageDataUrl(logoPng);
      doc.addImage(logoDataUrl, 'PNG', 10, 10, 60, 20); // Adjust size as needed
  
      // Add company details
      let headerY = 10 + 20 + 12; // logo Y + logo height + extra space
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
      doc.text(greeting, 14, headerY + 24);
      
      doc.setFontSize(11);
      const introText = [
        "Thank you for choosing ExcelyTech for your backup and security needs. We are pleased to present this detailed quote for our services, tailored to meet your requirements. Below, you will find a comprehensive breakdown of your proposed solution:"
      ];
      let currentY = headerY + 34;
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
      const validProducts = products.filter(p => {
        const slab = (p.pricingSlabs || [])[0];
        const margin = slab && typeof slab.margin === 'number' ? slab.margin : null;
        return margin !== null && !isNaN(margin) && margin >= 0.2;
      });
      const productRows = validProducts.map(p => [
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
        `$${finalCustomerTotal.toFixed(2)}`
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
      
      const pageHeight = doc.internal.pageSize.height;
      const bottomMargin = 20;
      const minSpaceNeeded = 60; // adjust as needed for your terms section

      if (currentY > pageHeight - minSpaceNeeded - bottomMargin) {
        doc.addPage();
        currentY = 20; // or whatever your top margin is
      }

      // Now add Terms & Conditions at currentY
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
  
      let footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = "Confidential - This document contains proprietary information and is intended solely for the recipient.";
      const splitFooter = doc.splitTextToSize(footerText, 180);
      doc.text(splitFooter, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
  
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
      doc.text("Customer Signature:", 14, currentY);
      currentY += 10;
      doc.text("Date:", 14, currentY);
      currentY += 10;
      doc.text("ExcelyTech Representative:", 14, currentY);
      currentY += 10;
      doc.text("Date:", 14, currentY);
  
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
      doc.text(splitFooter, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
  
      // Generate QR code with summary info
      const qrText = `Customer: ${customerName || 'N/A'}\nCompany: ${customerCompany || 'N/A'}\nTotal: $${finalCustomerTotal.toFixed(2)} CAD\nDate: ${new Date().toLocaleDateString('en-CA')}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { width: 80, margin: 1 });
      // Place QR code just above the footer, smaller size
      const qrSize = 36;
      const pageWidth = doc.internal.pageSize.getWidth();
      const firstPageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(qrDataUrl, 'PNG', pageWidth - qrSize - 30, firstPageHeight - qrSize - 70, qrSize, qrSize);
  
      // Add footer to every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        let footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(splitFooter, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
      }
  
      doc.save(`ExcelyTech_Quote_${customerName || "Customer"}_${new Date().toISOString().slice(0, 10)}.pdf`);
        
      setIsGeneratingPDF(false);
      showNotification("PDF Downloaded Successfully!");
      return true;
    } catch (error) {
      console.error("PDF Generation Failed:", error);
      setValidationError(`Error generating PDF: ${error.message || "Please try again"}`);
      showNotification(`Error generating PDF: ${error.message || "Please try again"}`);
      setIsGeneratingPDF(false);
      return false;
    }
  };

  const handleSendEmail = async () => {
    try {
      if (!validateQuoteGeneration()) {
        throw new Error("Please validate quote details first");
      }
      if (!customerEmail) {
        throw new Error("Please enter customer email first");
      }
      if (!validateEmail(customerEmail)) {
        throw new Error("Please enter a valid email address");
      }
  
      setIsGeneratingPDF(true);
      setValidationError("");
  
      // Add this block to define validProducts for email content
      const validProducts = products.filter(p => {
        const slab = (p.pricingSlabs || [])[0];
        const margin = slab && typeof slab.margin === 'number' ? slab.margin : null;
        return margin !== null && !isNaN(margin) && margin >= 0.2;
      });
  
      // Generate QR code with summary info
      const qrText = `Customer: ${customerName || 'N/A'}\nCompany: ${customerCompany || 'N/A'}\nTotal: $${finalCustomerTotal.toFixed(2)} CAD\nDate: ${new Date().toLocaleDateString('en-CA')}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { width: 80, margin: 1 });
  
      // Generate the email content to match the PDF structure
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <!-- Company Details -->
          <div style="margin-bottom: 10px; text-align: left; font-size: 12px; color: #666;">
            <p style="margin: 5px 0;">Ontario, Canada</p>
            <p style="margin: 5px 0;">289-291-6377</p>
            <p style="margin: 5px 0;">info@excelytech.com</p>
          </div>
  
          <!-- Horizontal Line -->
          <div style="border-bottom: 1px solid #e0e0e0; margin-bottom: 10px;"></div>
  
          <!-- Quote Details -->
          <div style="margin-bottom: 20px; text-align: left; font-size: 12px; color: #666;">
            <p style="margin: 5px 0;">Quote Date: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p style="margin: 5px 0;">Quote #: ${Math.floor(1000 + Math.random() * 9000)}</p>
            <p style="margin: 5px 0;">Prepared for: ${customerName || "Customer"} <span style="color: #d32f2f;">**Quote Valid for 30 Days**</span></p>
          </div>
  
          <!-- Greeting -->
          <div style="margin-bottom: 20px; text-align: left;">
            <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">${salutation} ${customerName || "Customer"},</p>
            <p style="margin: 5px 0; font-size: 12px;">Thank you for choosing ExcelyTech for your backup and security needs. We are pleased to present this detailed quote for our services, tailored to meet your requirements. Below, you will find a comprehensive breakdown of your proposed solution:</p>
          </div>
  
          <!-- Quote Summary -->
          <div style="margin-bottom: 20px; text-align: left;">
            <h2 style="color: #1e88e5; margin: 0 0 10px; font-size: 16px;">Quote Summary: ${getPackageName(products)}</h2>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Billing Cycle: ${billingCycle === 'monthly' ? 
              'Monthly subscription - You will be charged this amount every month' : 
              'Annual subscription - You will be charged this amount once per year'}</p>
          </div>
  
          <!-- Products Table -->
          <div style="margin-bottom: 20px; text-align: left;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px;">
              <thead>
                <tr style="background-color: #1e88e5; color: white;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #1565c0;">Product Name</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #1565c0;">Description</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #1565c0;">Qty</th>
                  <th style={{ padding: "15px", fontWeight: "500", width: "10%", textAlign: "right" }}>
                    Price
                    <span title="For non-DR: Unit Cost + (Unit Cost × Margin %). For DR: Unit Cost + 13% tax." style={{ marginLeft: 4, color: '#888', cursor: 'help', fontSize: 16 }}>ⓘ</span>
                  </th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #1565c0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${validProducts.map(p => `
                  <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 8px; text-align: left;">${p.name}</td>
                    <td style="padding: 8px; text-align: left;">${p.description}</td>
                    <td style="padding: 8px; text-align: right;">${p.qty}</td>
                    <td style="padding: 8px; text-align: right;">$${getPricingData(p, p.qty).recommendedPrice.toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right;">$${(getPricingData(p, p.qty).recommendedPrice * p.qty * billingMultiplier).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="padding: 8px; text-align: left;" colspan="2">Implementation & Support</td>
                  <td style="padding: 8px; text-align: right;">1</td>
                  <td style="padding: 8px; text-align: right;">$${proFeeForCalc.toFixed(2)}</td>
                  <td style="padding: 8px; text-align: right;">$${proFeeForCalc.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="padding: 8px; text-align: left;" colspan="4">Tax (13% HST)</td>
                  <td style="padding: 8px; text-align: right;">$${taxOnCustomer.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                  <td style="padding: 8px; text-align: left;" colspan="4">Payment Processing${waiveStripe ? " waived" : ""}</td>
                  <td style="padding: 8px; text-align: right;">$${stripeFee.toFixed(2)}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f5f5f5;">
                  <td style="padding: 8px; text-align: left;" colspan="3">TOTAL (${billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Charge)</td>
                  <td style="padding: 8px; text-align: right;"></td>
                  <td style="padding: 8px; text-align: right;">$${finalCustomerTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
  
          <!-- Terms & Conditions -->
          <div style="margin-bottom: 20px; text-align: left;">
            <h2 style="color: #1e88e5; margin: 0 0 10px; font-size: 16px;">Terms & Conditions:</h2>
            <ol style="padding-left: 20px; margin: 0; font-size: 12px; color: #666;">
              <li style="margin-bottom: 8px;">Validity: This quote is valid for 30 days from the date of issue. Prices are subject to change thereafter.</li>
              <li style="margin-bottom: 8px;">Payment Terms: Invoices are due within 15 days of receipt. ${billingCycle === 'monthly' ? 
                'Monthly subscriptions will be automatically charged on the 1st of each month.' : 
                'Annual subscriptions require full payment upfront within 15 days of invoice receipt.'}</li>
              <li style="margin-bottom: 8px;">Service Commencement: Services will commence upon receipt of signed agreement and initial payment.</li>
              <li style="margin-bottom: 8px;">Cancellation Policy: Subscriptions may be canceled with 30 days' written notice. No refunds will be issued for partial terms.</li>
              <li style="margin-bottom: 8px;">Limitation of Liability: ExcelyTech shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</li>
              <li style="margin-bottom: 8px;">Governing Law: This agreement shall be governed by the laws of Ontario, Canada.</li>
            </ol>
          </div>
  
          <!-- Key Terms and Conditions (MSA) -->
          <div style="margin-bottom: 20px; text-align: left;">
            <h2 style="color: #1e88e5; margin: 0till 0 10px; font-size: 16px;">Key Terms and Conditions:</h2>
            <ol style="padding-left: 20px; margin: 0; font-size: 12px; color: #666;">
              <li style="margin-bottom: 8px;">Quote Definition: This Product Quotation outlines the costs and terms for Products/Services, forming part of the Master Agreement.</li>
              <li style="margin-bottom: 8px;">Payment: Fees are due monthly on the 1st via direct debit; late fees apply. Hardware/software must be paid before deployment. Fees may increase after 12 months (up to 10% annually with 60 days' notice).</li>
              <li style="margin-bottom: 8px;">Term: The agreement lasts 36 months, auto-renewing yearly unless terminated with 60 days' notice.</li>
              <li style="margin-bottom: 8px;">Termination/Cancellation: Early termination incurs remaining fees; Product cancellation incurs a 15% restocking fee (no returns for delivered/custom items).</li>
              <li style="margin-bottom: 8px;">Confidentiality: Quote details are confidential and must not be disclosed.</li>
              <li style="margin-bottom: 8px;">Warranties: Product warranties are passed on; out-of-warranty support requires a separate quote.</li>
              <li style="margin-bottom: 8px;">Additional Costs: Costs (hourly, after-hours, agreement rates) and additional services are defined in the Product Quotation.</li>
            </ol>
          </div>
  
          <!-- Acceptance -->
          <div style="margin-bottom: 20px; text-align: left;">
            <h2 style="color: #1e88e5; margin: 0 0 10px; font-size: 16px;">Acceptance:</h2>
            <p style="margin: 5px 0; font-size: 12px;">Customer Signature:</p>
            <p style="margin: 5px 0; font-size: 12px;">Date:</p>
            <p style="margin: 5px 0; font-size: 12px;">ExcelyTech Representative:</p>
            <p style="margin: 5px 0; font-size: 12px;">Date:</p>
          </div>
  
          <!-- Appreciation and Contact -->
          <div style="margin-bottom: 20px; text-align: left;">
            <p style="color: #1e88e5; margin: 5px 0; font-size: 12px;">We appreciate your business!</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Ontario, Canada</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">289-291-6377</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">info@excelytech.com</p>
          </div>
  
          <!-- QR Code -->
          <div style="margin-bottom: 20px; text-align: right;">
            <img src="${qrDataUrl}" alt="Quote QR Code" style="width: 80px; height: 80px;">
          </div>
  
          <!-- Confidential Notice -->
          <div style="font-size: 10px; color: #666; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px;">
            <p style="margin: 5px 0;">Confidential - This document contains proprietary information and is intended solely for the recipient.</p>
          </div>

          <div style="text-align:center; margin-top:40px;">
            <table width="200" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td align="center">
                  <img src="https://excelytech.com/wp-content/uploads/2025/01/excelytech-logo.png" width="200" style="display:block; max-width:200px; height:auto;" alt="ExcelyTech Logo">
                </td>
              </tr>
            </table>
          </div>
        </div>
      `;
  
      const quoteNumber = `QT${new Date().getFullYear()}${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;
      const emailParams = {
        to_email: customerEmail,
        from_name: "ExcelyTech Sales Team",
        subject: generateEmailSubject(customerName, billingCycle === 'annual' ? 'ANNUAL' : 'MONTHLY'),
        message: emailContent,
      };
  
      await sendEmail(emailParams);
      showNotification("Email sent successfully!");
      setIsGeneratingPDF(false);
    } catch (error) {
      console.error("Email Sending Failed:", error);
      setValidationError(error.message);
      showNotification(`Failed to send email: ${error.message}`);
      setIsGeneratingPDF(false);
    }
  };

  // Check if any product margin is below 20%
  const hasLowMargin = products.some(p => {
    const slab = (p.pricingSlabs || [])[0];
    const margin = slab && typeof slab.margin === 'number' ? slab.margin : null;
    if (margin === null || isNaN(margin)) return false;
    return !p.isHomeGrown && margin < productMarginThreshold;
  });

  // Add a handler for resetting all fields
  const handleResetAll = () => {
    setCustomerName("");
    setSalutation("Mr.");
    setCustomerEmail("");
    setCustomerAddress("");
    setCustomerCompany("");
    setCustomerPhone("");
    setSelectedProduct(PRODUCTS[0].name);
    setQty(1);
    setServiceCharge(0);
    setBillingCycle("monthly");
    setWaiveStripe(false);
    setProducts([]); // clears cart
    setCustomProducts([]); // clears custom products
    setShowAddProductForm(false);
    setNewProduct({ name: '', description: '', license: '', unitCost: 0, margin: 35 });
    setValidationError("");
    setCardType('domestic');
    setProductMarginThreshold(20);
    setPackageMarginThreshold(15);
    showNotification("All fields have been reset");
  };

  const handleAddProductClick = () => {
    setShowAddProductForm(true);
    setNewProduct({ name: '', description: '', license: '', unitCost: 0, margin: 35 });
  };

  const handleNewProductChange = (field, value) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      showNotification('Product name is required');
      return;
    }
    if (allProducts.some(p => p.name === newProduct.name.trim())) {
      showNotification('Product name must be unique');
      return;
    }
    // Add a default pricingSlabs array for compatibility
    const isDR = newProduct.name === 'Disaster Recovery' || newProduct.name === 'DR';
    const productToAdd = {
      ...newProduct,
      qty: 1,
      pricingSlabs: [isDR ? {
        minQty: 1,
        maxQty: 9999,
        unitCost: Number(newProduct.unitCost),
        recommendedPrice: Number(newProduct.unitCost)
      } : {
        minQty: 1,
        maxQty: 9999,
        unitCost: Number(newProduct.unitCost),
        margin: Number(newProduct.margin),
        recommendedPrice: Number(newProduct.unitCost) * (1 + Number(newProduct.margin) / 100)
      }],
    };
    setCustomProducts(prev => [...prev, productToAdd]);
    setShowAddProductForm(false);
    setSelectedProduct(newProduct.name);
    showNotification('Product added');
  };

  // Handler to remove a custom product
  const handleRemoveCustomProduct = (name) => {
    setCustomProducts(prev => prev.filter(p => p.name !== name));
    // If the removed product is currently selected, reset selection
    if (selectedProduct === name) {
      setSelectedProduct(PRODUCTS[0].name);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\+?[\d\s-]{10,}$/;
    return re.test(phone);
  };

  const updateUnitCost = (name, newUnitCost) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.name === name) {
          const isDR = p.isHomeGrown;
          const updatedSlabs = p.pricingSlabs.map(slab => ({
            ...slab,
            unitCost: newUnitCost,
            recommendedPrice: isDR ? newUnitCost * 1.13 : newUnitCost * (1 + (slab.margin || 0) / 100)
          }));
          return { ...p, unitCost: newUnitCost, pricingSlabs: updatedSlabs };
        }
        return p;
      })
    );
  };

  // Example: get background color for cards/tables based on darkMode
  const getCardBackground = () => darkMode ? styles.cardBackground : styles.cardBackground;
  const getTableBackground = () => darkMode ? styles.cardBackground : '#fff';

  // Add this conditional rendering at the top of the return statement
  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  // Calculate the sum of the 'Price' column (before tax) for all products
  const productPriceTotal = products
    .filter(p => {
      const slab = (p.pricingSlabs || [])[0];
      const margin = slab && typeof slab.margin === 'number' ? slab.margin : null;
      return margin !== null && !isNaN(margin) && margin >= 0.2;
    })
    .map(p => {
      const slab = (p.pricingSlabs || []).find(
        slab => p.qty >= slab.minQty && p.qty <= slab.maxQty
      ) || (p.pricingSlabs ? p.pricingSlabs[p.pricingSlabs.length - 1] : { unitCost: 0, margin: 0 });
      const baseUnitCost = typeof p.unitCost === 'number' ? p.unitCost : slab.unitCost;
      const margin = typeof p.margin === 'number' ? p.margin : (slab.margin || 0);
      const unitPrice = baseUnitCost * 1.13;
      const price = unitPrice * (1 + margin);
      return price * p.qty;
    }).reduce((sum, val) => sum + val, 0);

  return (
    <ErrorBoundary>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          maxWidth: '1200px',
          margin: '30px auto',
          fontFamily: "'Roboto', sans-serif",
          padding: '0 20px',
          backgroundColor: styles.backgroundColor,
          color: styles.textColor,
          minHeight: '100vh',
          transition: 'background 0.3s, color 0.3s',
          marginTop: '40px',
        }}
      >
        {/* Responsive styles for summary sidebar */}
        <style>{`
          @media (max-width: 900px) {
            .summary-sidebar {
              flex-direction: row !important;
              position: static !important;
              min-width: 0 !important;
              max-width: 100vw !important;
              width: 100vw !important;
              margin: 0 0 18px 0 !important;
              gap: 12px !important;
              justify-content: center;
            }
            .summary-card {
              min-width: 0 !important;
              flex: 1 1 0;
              max-width: 100%;
              margin: 0 !important;
              padding: 16px 8px !important;
              font-size: 15px !important;
            }
          }
        `}</style>
        {/* Left: Summary Cards (always visible) */}
        <div className="summary-sidebar" style={{
          position: 'sticky',
          top: 40,
          alignSelf: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          minWidth: '220px',
          maxWidth: '240px',
          zIndex: 10,
          marginRight: '36px',
        }}>
          <div className="summary-card" style={{
            background: styles.cardBackground,
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            padding: '22px 18px',
            border: `1.5px solid ${styles.borderColor}`,
            textAlign: 'left',
          }}>
            <h3 style={{ margin: '0 0 8px', color: styles.textColor, fontSize: '17px', fontWeight: 700 }}>Final Total</h3>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: styles.primaryColor }}>
              ${products.length > 0 ? productPriceTotal.toFixed(2) : '0.00'} CAD
            </p>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>
              {billingCycle === 'annual' ? 'per year' : 'per month'}
            </p>
          </div>
          <div className="summary-card" style={{
            background: styles.cardBackground,
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            padding: '22px 18px',
            border: `1.5px solid ${styles.borderColor}`,
            textAlign: 'left',
          }}>
            <h3 style={{ margin: '0 0 8px', color: styles.textColor, fontSize: '17px', fontWeight: 700 }}>Estimated Profit</h3>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: styles.secondaryColor }}>
              ${products.length > 0 ? profitAfterTax.toFixed(2) : '0.00'}
            </p>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>
              After Tax ({billingCycle === 'annual' ? 'per year' : 'per month'})
            </p>
          </div>
          <div className="summary-card" style={{
            background: styles.cardBackground,
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            padding: '22px 18px',
            border: `1.5px solid ${styles.borderColor}`,
            textAlign: 'left',
          }}>
            <h3 style={{ margin: '0 0 8px', color: styles.textColor, fontSize: '17px', fontWeight: 700 }}>Package</h3>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: styles.textColor }}>
              {products.length > 0 ? getPackageName(products) : 'N/A'}
            </p>
          </div>
        </div>
        {/* Right: Main Content */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 80 }}>
          {/* Top-right notification and vertical button group */}
        <div
          style={{
            position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 200,
            display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '16px',
            }}
          >
            {/* Notification */}
            <Notification key={notificationKey} message={notification} onClose={() => setNotification("")} />
            {/* Vertical button group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
              {/* Notification Bell */}
              <button
                onClick={() => showNotification("Notifications are enabled")}
                className="action-button notification-bell"
                style={{
                  background: '#e3f2fd',
                  color: '#1976d2',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 2px 8px rgba(25,118,210,0.15)',
                  cursor: 'pointer',
                }}
                title="Notifications"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#1976d2"/>
                </svg>
              </button>
              {/* Logout Button */}
          <button
            onClick={() => {
              setAuthenticated(false);
              localStorage.removeItem('authenticated');
            }}
                className="action-button logout-button"
            style={{
                  background: '#ffebee',
                  color: '#d32f2f',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 2px 8px rgba(211,47,47,0.15)',
                  cursor: 'pointer',
            }}
            title="Logout"
          >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="#d32f2f"/>
                </svg>
          </button>
              {/* Dark Mode Toggle */}
          <button
                onClick={() => setDarkMode((prev) => !prev)}
                className="action-button dark-mode-toggle"
            style={{
                  background: darkMode ? '#424242' : '#e3f2fd',
                  color: darkMode ? '#fff' : '#1976d2',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(25,118,210,0.15)',
              cursor: 'pointer',
                }}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM2 13H4C4.55 13 5 12.55 5 12C5 11.45 4.55 11 4 11H2C1.45 11 1 11.45 1 12C1 12.55 1.45 13 2 13ZM20 13H22C22.55 13 23 12.55 23 12C23 11.45 22.55 11 22 11H20C19.45 11 19 11.45 19 12C19 12.55 19.45 13 20 13ZM11 2V4C11 4.55 11.45 5 12 5C12.55 5 13 4.55 13 4V2C13 1.45 12.55 1 12 1C11.45 1 11 1.45 11 2ZM11 20V22C11 22.55 11.45 23 12 23C12.55 23 13 22.55 13 22V20C13 19.45 12.55 19 12 19C11.45 19 11 19.45 11 20ZM5.99 4.58C5.6 4.19 4.96 4.19 4.58 4.58C4.19 4.97 4.19 5.61 4.58 5.99L5.64 7.05C6.03 7.44 6.67 7.44 7.05 7.05C7.44 6.66 7.44 6.02 7.05 5.64L5.99 4.58ZM18.36 16.95C17.97 16.56 17.33 16.56 16.95 16.95C16.56 17.34 16.56 17.98 16.95 18.36L18.01 19.42C18.4 19.81 19.04 19.81 19.42 19.42C19.81 19.03 19.81 18.39 19.42 18.01L18.36 16.95ZM19.42 5.99C19.81 5.6 19.81 4.96 19.42 4.58C19.03 4.19 18.39 4.19 18.01 4.58L16.95 5.64C16.56 6.03 16.56 6.67 16.95 7.05C17.34 7.44 17.98 7.44 18.36 7.05L19.42 5.99ZM7.05 18.36C7.44 17.97 7.44 17.33 7.05 16.95C6.66 16.56 6.02 16.56 5.64 16.95L4.58 18.01C4.19 18.4 4.19 19.04 4.58 19.42C4.97 19.81 5.61 19.81 5.99 19.42L7.05 18.36Z" fill={darkMode ? "#fff" : "#1976d2"}/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 19C8.14 19 5 15.86 5 12C5 8.14 8.14 5 12 5C15.86 5 19 8.14 19 12C19 15.86 15.86 19 12 19Z" fill="#1976d2"/>
                    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#1976d2"/>
                  </svg>
                )}
              </button>
              {/* PDF Generation */}
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="action-button pdf-button"
                style={{
                  background: '#fff5f5',
                  color: '#d32f2f',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 2px 8px rgba(211,47,47,0.15)',
                  cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
                  opacity: isGeneratingPDF ? 0.6 : 1
                }}
                title="Generate PDF"
                aria-label="Generate PDF"
              >
                {isGeneratingPDF ? (
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="#d32f2f"/>
                  </svg>
                )}
          </button>
              {/* Email Generation */}
          <button
                onClick={handleSendEmail}
                disabled={isGeneratingPDF || !customerEmail}
                className="action-button email-button"
            style={{
                  background: '#e3f2fd',
                  color: '#1976d2',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 2px 8px rgba(25,118,210,0.15)',
                  cursor: isGeneratingPDF || !customerEmail ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isGeneratingPDF || !customerEmail ? 0.6 : 1
                }}
                title="Send Email"
                aria-label="Send Email"
              >
                {isGeneratingPDF ? (
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM19.6 8.25L12.53 12.67C12.21 12.87 11.79 12.87 11.47 12.67L4.4 8.25C4.15 8.09 4 7.82 4 7.53C4 6.86 4.73 6.46 5.3 6.81L12 11L18.7 6.81C19.27 6.46 20 6.86 20 7.53C20 7.82 19.85 8.09 19.6 8.25Z" fill="#1976d2"/>
                  </svg>
                )}
          </button>
            </div>
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
                color: #b0b8c9 !important;
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
                background: #232a36 !important;
              }
              tr {
                background: #232a36 !important;
            }
            button {
              font-family: 'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif !important;
            }
              /* Soft button tweaks for dark mode */
              .soft-btn-dark {
                background: #2d2d3a !important;
                color: #ff6d6d !important;
                box-shadow: 0 2px 8px rgba(211,47,47,0.13) !important;
              }
              /* Customer Info Card improvements */
              .customer-info-card {
                background: #232a36 !important;
                border-radius: 18px !important;
                border: 1.5px solid #2a3140 !important;
                box-shadow: 0 4px 24px rgba(30,136,229,0.10) !important;
                padding: 36px 32px 32px 32px !important;
                margin-bottom: 32px !important;
              }
              .customer-info-grid {
                gap: 36px 32px !important;
                margin-bottom: 18px !important;
              }
              .customer-info-field {
                background: #262b36 !important;
                border-radius: 16px !important;
                box-shadow: 0 2px 8px rgba(30,136,229,0.04) !important;
                padding: 22px 18px 16px 18px !important;
                min-width: 0;
              }
              .customer-info-label {
                font-weight: 800 !important;
                color: #64b5f6 !important;
                font-size: 1.13rem !important;
                margin-bottom: 10px !important;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .customer-info-tooltip {
                color: #b0b8c9 !important;
                font-size: 15px !important;
                cursor: pointer;
                margin-left: 4px;
              }
              .customer-info-input {
                background: #232a36 !important;
                color: #f5f6fa !important;
                border: 1.5px solid #3a4256 !important;
                font-size: 1.13rem !important;
                border-radius: 8px !important;
                padding: 14px 12px !important;
                margin-top: 4px !important;
              }
              .customer-info-input:focus {
                border: 1.5px solid #64b5f6 !important;
                outline: none !important;
              }
              .customer-info-reset {
                background: #e3f2fd !important;
                color: #1976d2 !important;
                border: 1.5px solid #90caf9 !important;
                border-radius: 10px !important;
                font-weight: 700 !important;
                font-size: 15px !important;
                padding: 8px 22px !important;
                box-shadow: 0 2px 8px rgba(30,136,229,0.07) !important;
                transition: background 0.2s !important;
              }
              .customer-info-reset:hover {
                background: #bbdefb !important;
              }
              /* Top bar/time zone improvements */
              .topbar-timezone {
                background: #232a36 !important;
                border-radius: 16px !important;
                box-shadow: 0 2px 16px rgba(30,136,229,0.10) !important;
                padding: 18px 36px 18px 36px !important;
                display: flex;
                align-items: center;
                gap: 32px;
                margin-bottom: 18px !important;
              }
              .timezone-label {
                color: #64b5f6 !important;
                font-weight: 700 !important;
                font-size: 1.08rem !important;
                letter-spacing: 1px;
              }
              .timezone-time {
                color: #e3f2fd !important;
                font-size: 1.13rem !important;
                font-family: monospace !important;
                margin-top: 2px;
                text-shadow: 0 0 4px #1976d2;
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
                src="https://excelytech.com/wp-content/uploads/2025/01/excelytech-logo.png"
                alt="ExcelyTech Logo" 
                style={{ height: '44px', width: 'auto', borderRadius: '4px', background: 'transparent' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: styles.primaryColor, letterSpacing: '1px' }}>{usCanLabel}</span>
                  <span style={{ fontSize: '15px', fontFamily: 'monospace', marginTop: '2px', color: styles.textColor }}>{usCanTime}</span>
              </div>
              <div style={{ width: '1px', height: '28px', background: '#e0e0e0', borderRadius: '1px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: styles.primaryColor, letterSpacing: '1px' }}>IND</span>
                  <span style={{ fontSize: '15px', fontFamily: 'monospace', marginTop: '2px', color: styles.textColor }}>{indTimeString}</span>
              </div>
            </div>
          </div>

            

          <div style={{
            backgroundColor: styles.cardBackground,
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '30px',
            position: 'relative',
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
              Customer Information
            </h2>
            <button
                onClick={handleResetAll}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                padding: '6px 16px',
                background: '#e3f2fd',
                color: '#1976d2',
                border: '1.5px solid #90caf9',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
                zIndex: 2
              }}
            >
              Reset
            </button>
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
                  onChange={handleCustomerNameChange}
                  className="customer-info-input"
                  placeholder="Enter customer name"
                />
                {validationError && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{validationError}</span>}
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
                  onChange={(e) => handleEmailChange(e)}
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
                  onChange={(e) => handlePhoneChange(e)}
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
              gap: "16px",
              alignItems: "flex-end",
              width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', flex: '2 1 400px', minWidth: 0, gap: 10 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 6 }}>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    style={{
                      padding: "10px",
                      minWidth: "220px",
                      borderRadius: "6px",
                      border: `1px solid ${styles.inputBorder}`,
                      backgroundColor: "#fff",
                      color: styles.textColor,
                      fontSize: "16px",
                      flex: '1 1 220px',
                      marginRight: 8
                    }}
                  >
                    {allProducts.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddProductClick}
                      style={{
                        background: '#e3f2fd',
                        color: '#1976d2',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px',
                        boxShadow: '0 2px 8px rgba(30,136,229,0.07)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      title="Add New Product"
                      aria-label="Add New Product"
                    >
                      <span style={{fontWeight: 700, fontSize: '28px', lineHeight: 1}}>+</span>
                  </button>
                  {/* Show remove buttons for custom products */}
                  {customProducts.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {customProducts.map(p => (
                        <button
                          key={p.name}
                          type="button"
                          title={`Remove ${p.name}`}
                          onClick={() => handleRemoveCustomProduct(p.name)}
                          style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}
                        >
                          🗑️
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flex: '0 0 auto' }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: styles.textColor, whiteSpace: 'nowrap' }}>
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
                <button
                  onClick={addProduct}
                  style={{
                    padding: "10px 18px",
                    backgroundColor: styles.buttonBackground,
                    color: styles.buttonText,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 600,
                    marginLeft: 4
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1565c0"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.buttonBackground}
                >
                  + Add
                </button>
              </div>
            </div>
            {showAddProductForm && (
              <form onSubmit={handleAddProductSubmit} style={{
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 20,
                boxShadow: '0 8px 32px rgba(30,136,229,0.10)',
                padding: 36,
                maxWidth: 640,
                margin: '0 auto',
                marginTop: 32,
                marginBottom: 32,
                border: '1.5px solid #e3e8ee',
                transition: 'box-shadow 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                  <span style={{ fontSize: 32, color: '#1976d2', marginRight: 14 }}>🛒</span>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: 26, color: '#1976d2', letterSpacing: 1 }}>Add New Product</h2>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 24,
                  marginBottom: 28
                }}>
                  <div>
                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#333' }}>Product Name</label>
                    <input type="text" placeholder="Name" value={newProduct.name} onChange={e => handleNewProductChange('name', e.target.value)}
                      style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', marginBottom: 4, fontSize: 16, transition: 'border 0.2s' }} />
                    <small style={{ color: '#888' }}>Enter a unique product name.</small>
                  </div>
                  <div>
                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#333' }}>Description</label>
                    <input type="text" placeholder="Description" value={newProduct.description} onChange={e => handleNewProductChange('description', e.target.value)}
                      style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', marginBottom: 4, fontSize: 16, transition: 'border 0.2s' }} />
                    <small style={{ color: '#888' }}>Briefly describe the product.</small>
                  </div>
                  <div>
                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#333' }}>License</label>
                    <input type="text" placeholder="License" value={newProduct.license} onChange={e => handleNewProductChange('license', e.target.value)}
                      style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', marginBottom: 4, fontSize: 16, transition: 'border 0.2s' }} />
                    <small style={{ color: '#888' }}>E.g., Annual, Perpetual, etc.</small>
                  </div>
                  <div>
                    <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#333' }}>Unit Cost</label>
                    <input type="number" placeholder="Unit Cost" value={newProduct.unitCost} min={0} onChange={e => handleNewProductChange('unitCost', e.target.value)}
                      style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', marginBottom: 4, fontSize: 16, transition: 'border 0.2s' }} />
                    <small style={{ color: '#888' }}>Enter the cost per unit.</small>
                  </div>
                  {newProduct.name !== 'Disaster Recovery' && newProduct.name !== 'DR' && (
                    <div>
                      <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', color: '#333' }}>Margin (%)</label>
                      <input type="number" placeholder="Margin (%)" value={newProduct.margin} min={0} max={100} onChange={e => handleNewProductChange('margin', e.target.value)}
                        style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', marginBottom: 4, fontSize: 16, transition: 'border 0.2s' }} />
                      <small style={{ color: '#888' }}>Recommended: 35% or higher.</small>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 18, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="submit" style={{
                    background: 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 36px',
                    fontWeight: 800,
                    fontSize: 18,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(25,118,210,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 0.2s'
                  }}>
                    <span style={{ fontSize: 20 }}>➕</span> Add
                  </button>
                  <button type="button" onClick={() => setShowAddProductForm(false)} style={{
                    background: '#fff',
                    color: '#1976d2',
                    border: '1.5px solid #90caf9',
                    borderRadius: 10,
                    padding: '12px 36px',
                    fontWeight: 800,
                    fontSize: 18,
                    cursor: 'pointer'
                  }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {products.length > 0 && (
              <ProductTable
                products={products}
                billingCycle={billingCycle}
                styles={styles}
                updateQty={updateQty}
                updateUnitCost={updateUnitCost}
                updateMargin={updateMargin}
                removeProduct={removeProduct}
              />
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
                <ul style={{ paddingLeft: "20px", margin: 0, color: styles.textColor, listStyleType: "none" }}>
                {recommendations.map((rec, index) => (
                  <li key={index} style={{ 
                    marginBottom: "12px", 
                    fontSize: "15px", 
                    position: "relative",
                      paddingLeft: "25px",
                      color: styles.textColor
                  }}>
                    <span style={{
                      position: "absolute",
                      left: 0,
                      top: "3px",
                        color: styles.textColor,
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
              backgroundColor: styles.cardBackground,
              color: styles.textColor,
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              minHeight: '480px'
            }}>
              <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
                Financial Summary
              </h2>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <tbody>
                  <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left', width: '60%' }}>
                      Our Cost to Pax8 (incl. 13% tax):
                    </td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor, width: '40%' }}>
                      ${pax8Total.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left' }}>
                      Professional Services & Support:
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${proFeeForCalc.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left' }}>
                      Customer Amount (Before Tax):
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${customerSubtotal.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                      <td style={{ padding: "10px 0", color: styles.textColor, textAlign: 'left', fontWeight: 400 }}>
                      Customer Total (Before Fee):
                    </td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor, fontWeight: 400 }}>
                      ${customerTotalBeforeFee.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                      <td style={{ padding: "10px 0", color: styles.textColor, textAlign: 'left', fontWeight: 400 }}>
                      Customer Total (After Payment Processing Fee):
                    </td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor, fontWeight: 400 }}>
                      ${finalCustomerTotal.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left' }}>
                      Estimated Profit Before Tax:
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                      ${profitBeforeTax.toFixed(2)} CAD
                    </td>
                  </tr>
                  <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left' }}>
                      Estimated Profit After Tax:
                    </td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 'bold', color: '#2e7d32' }}>
                      ${profitAfterTax.toFixed(2)} CAD
                    </td>
                  </tr>
                </tbody>
              </table>
                <h2 style={{ margin: "32px 0 20px 0", fontSize: "20px", color: styles.primaryColor }}>
                  Taxes and Fees
                </h2>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left', width: '60%' }}>
                        Tax (13% HST):
                      </td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor, width: '40%' }}>
                        ${taxOnCustomer.toFixed(2)} CAD
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 0", fontWeight: 500, color: styles.textColor, textAlign: 'left' }}>
                        Payment Processing Fee:
                      </td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: styles.textColor }}>
                        ${stripeFee.toFixed(2)} CAD
                      </td>
                    </tr>
                  </tbody>
                </table>
              {customerTotalBeforeFee <= 0 && (
                <p style={{ 
                  color: '#d32f2f', 
                  fontSize: '14px', 
                  marginTop: '10px',
                  fontStyle: 'italic'
                }}>
                  Note: Payment processing fees may still apply even if no revenue is collected.
                </p>
              )}
            </div>
          </div>
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
                font-size: 0.78rem;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .customer-info-tooltip {
              color: #666;
                font-size: 11px;
              cursor: pointer;
              margin-left: 4px;
            }
            .customer-info-input {
              padding: 12px 10px;
              border-radius: 6px;
              border: 1.5px solid #bdbdbd;
              background: #fff;
              color: #222;
                font-size: 0.83rem;
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
      </div>
    </ErrorBoundary>
  );
}

// Add a global style block for font enhancement
<style>{`
  body, input, select, textarea, button, label, h1, h2, h3, h4, h5, h6, p, span, th, td, div {
    font-family: 'Inter', 'Roboto', 'Segoe UI', Arial, sans-serif !important;
    font-smooth: always;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`}</style>
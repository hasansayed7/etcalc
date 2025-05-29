import React, { useState, useCallback, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from 'qrcode';
import { PRODUCTS } from './data/products';
import { getPricingData, getPackageName, getRecommendations } from './utils/pricing';
import ErrorBoundary from './components/ErrorBoundary';
import logoLightPng from './assets/et_light.png';
import Login from './components/Login';
import bgCloud from './assets/bg_cloud.png';
import logoDarkPng from './assets/et_dark.png';
import Notification from './components/Notification';
import { sendEmail } from './utils/emailService';
import emailjs from '@emailjs/browser';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);
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
  const [notification, setNotification] = useState("");
  const [notificationKey, setNotificationKey] = useState(0);
  const [customProducts, setCustomProducts] = useState([]);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', license: '', unitCost: 0, margin: 35 });
  const [validationError, setValidationError] = useState("");
  const [canTime, setCanTime] = useState(new Date());
  const [indTime, setIndTime] = useState(new Date());
  const [usTime, setUsTime] = useState(new Date());

  // Memoize allProducts
  const allProducts = useMemo(() => [...PRODUCTS, ...customProducts], [customProducts]);

  // Calculate billing multiplier
  const billingMultiplier = billingCycle === "annual" ? 12 : 1;

  // Calculate pro fee
  const proFeeMonthly = serviceCharge / 12;
  const proFeeForCalc = billingCycle === "monthly" ? proFeeMonthly : serviceCharge;

  // Memoize calculations
  const calculations = useMemo(() => {
    const subtotal = products.reduce((sum, p) => {
      const pricingData = getPricingData(p, p.qty);
      return sum + pricingData.recommendedPrice * p.qty;
    }, 0) * billingMultiplier;

    const tax = (subtotal + proFeeForCalc) * 0.13;
    const stripeBase = subtotal + proFeeForCalc + tax;
    const stripeFee = waiveStripe ? 0 : stripeBase * 0.0299 + 0.30;
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
  const indTimeString = indTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
      alert(error.message);
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

  const pax8Subtotal = products.reduce((sum, p) => {
    const pricingData = getPricingData(p, p.qty);
    return sum + pricingData.unitCost * p.qty;
  }, 0);

  const pax8Total = pax8Subtotal * 1.13 * billingMultiplier;

  const customerSubtotal = calculations.subtotal;

  const taxOnCustomer = calculations.tax;

  const stripeBase = calculations.subtotal + calculations.stripeFee;
  const stripeFee = waiveStripe ? 0 : calculations.stripeFee;

  const finalTotal = calculations.total;

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

  const showNotification = (msg) => {
    setNotification(msg);
    setNotificationKey(prev => prev + 1);
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
      const img = new Image();
      img.src = logoLightPng;
      doc.addImage(img.src, 'PNG', 14, 10, 45, 9);
  
      // Add company details
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
  
      doc.save(`ExcelyTech_Quote_${customerName || "Customer"}_${new Date().toISOString().slice(0, 10)}.pdf`);
  
      // After PDF is generated, send email if customer email is provided
        
      setIsGeneratingPDF(false);
      return true;
    } catch (error) {
      console.error("PDF Generation Failed:", error);
      setValidationError(`Error generating PDF: ${error.message || "Please try again"}`);
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
  
      // Generate QR code with summary info
      const qrText = `Customer: ${customerName || 'N/A'}\nCompany: ${customerCompany || 'N/A'}\nTotal: $${finalTotal.toFixed(2)} CAD\nDate: ${new Date().toLocaleDateString('en-CA')}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { width: 80, margin: 1 });
  
      // Generate the email content to match the PDF structure
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <!-- Header with Logo -->
          <div style="text-align: left; margin-bottom: 20px; padding-bottom: 10px;">
            <img src="${logoLightPng}" alt="ExcelyTech Logo" style="height: 30px; margin-bottom: 10px;">
          </div>
  
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
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #1565c0;">Price</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #1565c0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
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
                  <td style="padding: 8px; text-align: right;">$${finalTotal.toFixed(2)}</td>
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
            <p style="margin: 5px 0; font-size: 12px;">Customer Signature: _______________________________ &nbsp;&nbsp; Date: ________________</p>
            <p style="margin: 5px 0; font-size: 12px;">ExcelyTech Representative: _______________________ &nbsp;&nbsp; Date: ________________</p>
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
        </div>
      `;
  
      const emailParams = {
        to_email: customerEmail,
        from_name: "ExcelyTech Sales Team",
        subject: `Quote for ${customerName || "Customer"} - ${new Date().toLocaleDateString()}`,
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
    const pricingData = getPricingData(p, p.qty);
    return pricingData.margin < 20;
  });

  // Add a handler for resetting customer info fields only
  const handleResetCustomerInfo = () => {
    setCustomerName("");
    setSalutation("Mr.");
    setCustomerEmail("");
    setCustomerAddress("");
    setCustomerCompany("");
    setCustomerPhone("");
    showNotification("Done");
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
    const productToAdd = {
      ...newProduct,
      qty: 1,
      pricingSlabs: [{
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
                <span style={{ fontWeight: 600, fontSize: '13px', color: styles.primaryColor, letterSpacing: '1px' }}>{usCanLabel}</span>
                <span style={{ fontSize: '15px', fontFamily: 'monospace', marginTop: '2px', color: '#333' }}>{usCanTime}</span>
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
            position: 'relative',
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "20px", color: styles.primaryColor }}>
              Customer Information
            </h2>
            <button
              onClick={handleResetCustomerInfo}
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
                    style={{ background: '#e3f2fd', color: '#1976d2', border: '1.5px solid #90caf9', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
                  >
                    + Add New Product
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
              <form onSubmit={handleAddProductSubmit} style={{ marginTop: 16, background: '#f7f9fc', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(30,136,229,0.07)', maxWidth: 500 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 500, marginBottom: 2, display: 'block' }}>Product Name</label>
                  <input type="text" placeholder="Name" value={newProduct.name} onChange={e => handleNewProductChange('name', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #bdbdbd', marginBottom: 6 }} />
                  <label style={{ fontWeight: 500, marginBottom: 2, display: 'block' }}>Description</label>
                  <input type="text" placeholder="Description" value={newProduct.description} onChange={e => handleNewProductChange('description', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #bdbdbd', marginBottom: 6 }} />
                  <label style={{ fontWeight: 500, marginBottom: 2, display: 'block' }}>License</label>
                  <input type="text" placeholder="License" value={newProduct.license} onChange={e => handleNewProductChange('license', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #bdbdbd', marginBottom: 6 }} />
                  <label style={{ fontWeight: 500, marginBottom: 2, display: 'block' }}>Unit Cost</label>
                  <input type="number" placeholder="Unit Cost" value={newProduct.unitCost} min={0} onChange={e => handleNewProductChange('unitCost', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #bdbdbd', marginBottom: 6 }} />
                  <label style={{ fontWeight: 500, marginBottom: 2, display: 'block' }}>Margin (%)</label>
                  <input type="number" placeholder="Margin (%)" value={newProduct.margin} min={0} max={100} onChange={e => handleNewProductChange('margin', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #bdbdbd' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Add</button>
                  <button type="button" onClick={() => setShowAddProductForm(false)} style={{ background: '#fff', color: '#1976d2', border: '1.5px solid #90caf9', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                </div>
              </form>
            )}
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
                      Customer Total (After Payment Processing Fee):
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold", color: styles.primaryColor }}>
                      ${calculations.stripeBase.toFixed(2)} CAD
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
          <Notification key={notificationKey} message={notification} onClose={() => setNotification("")} />
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              style={{
                backgroundColor: isGeneratingPDF ? "#90a4ae" : styles.buttonBackground,
                color: styles.buttonText,
                border: "none",
                padding: "16px 32px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isGeneratingPDF ? "not-allowed" : "pointer",
                borderRadius: "8px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                transition: "background-color 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px"
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
                  Generate PDF
                </>
              )}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isGeneratingPDF || !customerEmail}
              style={{
                backgroundColor: isGeneratingPDF || !customerEmail ? "#90a4ae" : "#4caf50",
                color: "#ffffff",
                border: "none",
                padding: "16px 32px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isGeneratingPDF || !customerEmail ? "not-allowed" : "pointer",
                borderRadius: "8px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
                transition: "background-color 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px"
              }}
            >
              {isGeneratingPDF ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                  Sending...
                </>
              ) : (
                <>
                  <span style={{ fontSize: "22px" }}>✉️</span>
                  Send Email
                </>
              )}
            </button>
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
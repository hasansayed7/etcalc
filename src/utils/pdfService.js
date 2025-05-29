import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { imageToDataUrl } from './emailService';
import logo from '../assets/et_dark.png';

export const generatePDF = async (data) => {
  try {
    const doc = new jsPDF();
    
    // Add logo as Data URL
    try {
      const logoDataUrl = await imageToDataUrl(logo);
      doc.addImage(logoDataUrl, 'PNG', 10, 10, 40, 20);
    } catch (logoError) {
      console.error('Error adding logo:', logoError);
      // Continue without logo if there's an error
    }
    
    // Add title
    doc.setFontSize(20);
    doc.text('ExcelyTech Quotation', 60, 25);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 60, 35);
    
    // Add customer info
    doc.setFontSize(12);
    doc.text('Customer Information:', 10, 50);
    doc.setFontSize(10);
    doc.text(`Name: ${data.customerName}`, 10, 60);
    doc.text(`Email: ${data.customerEmail}`, 10, 70);
    
    // Add products table
    const tableColumn = ['Product', 'Quantity', 'Price', 'Total'];
    const tableRows = data.products.map(product => [
      product.name,
      product.quantity,
      `$${product.price.toFixed(2)}`,
      `$${(product.quantity * product.price).toFixed(2)}`
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
    // Add total
    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.text(`Total Amount: $${data.totalAmount.toFixed(2)}`, 10, finalY + 20);
    
    // Add terms and conditions
    doc.setFontSize(10);
    doc.text('Terms and Conditions:', 10, finalY + 40);
    doc.setFontSize(8);
    const terms = [
      '1. Prices are subject to change without notice',
      '2. Payment terms: Net 30 days',
      '3. All prices are in USD',
      '4. Valid for 30 days from date of issue'
    ];
    terms.forEach((term, index) => {
      doc.text(term, 10, finalY + 50 + (index * 5));
    });
    
    // Add footer
    doc.setFontSize(8);
    doc.text('ExcelyTech - Your Trusted Technology Partner', 10, 280);
    doc.text('www.excelytech.com', 10, 285);
    
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}; 
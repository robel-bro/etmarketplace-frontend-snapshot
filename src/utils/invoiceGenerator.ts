import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order: any, user: any, seller: any) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('ET Marketplace', 14, 22);
  doc.setFontSize(10);
  doc.text('Invoice', 14, 30);

  // Order info
  doc.setFontSize(12);
  doc.text(`Order ID: ${order.id}`, 14, 40);
  doc.text(`Date: ${order.date}`, 14, 46);

  // Buyer info
  doc.text('Buyer:', 14, 56);
  doc.text(`${user.name}`, 14, 62);
  doc.text(`${user.email}`, 14, 68);
  doc.text(`${order.shippingAddress}`, 14, 74);

  // Seller info
  doc.text('Seller:', 120, 56);
  doc.text(`${seller.businessName}`, 120, 62);
  doc.text(`${seller.email}`, 120, 68);
  doc.text(`${seller.phone}`, 120, 74);

  // Items table
  const tableColumn = ['Product', 'Quantity', 'Price', 'Total'];
  const tableRows = order.items.map((item: any) => [
    item.name,
    item.quantity,
    `ETB ${item.price}`,
    `ETB ${item.price * item.quantity}`,
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 90,
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 90;
  doc.text(`Subtotal: ETB ${order.subtotal}`, 140, finalY + 10);
  doc.text(`Shipping: ETB ${order.shippingCost}`, 140, finalY + 16);
  doc.text(`Total: ETB ${order.total}`, 140, finalY + 24);

  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for shopping at ET Marketplace!', 14, finalY + 40);

  return doc;
};
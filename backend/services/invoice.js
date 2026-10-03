const PDFDocument = require("pdfkit");

const GOLD = "#C8A158";
const WINE = "#4C0E1B";
const INK  = "#2a2118";
const MUTED = "#8a7a68";
const LINE = "#e0d8c8";

function rupee(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeItemTax(item, settings) {
  const gstInclusive = settings.gstInclusive !== false;
  const gstPct = Number(item.gstPct ?? settings.defaultGstPct) || 5;
  const lineRevenue = Number(item.price) * Number(item.qty);
  let taxable, gstAmount;
  if (gstInclusive) {
    taxable = lineRevenue / (1 + gstPct / 100);
    gstAmount = lineRevenue - taxable;
  } else {
    taxable = lineRevenue;
    gstAmount = lineRevenue * (gstPct / 100);
  }
  return { taxable, gstAmount, gstPct, lineTotal: gstInclusive ? lineRevenue : lineRevenue + gstAmount };
}

function generateInvoicePDF(order, settings = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const storeName = settings.legalBusinessName || settings.storeName || "Aaradhya's Creation";
      const displayName = settings.storeName || storeName;
      const storeAddress = settings.address || "";
      const storeEmail = settings.contactEmail || "";
      const storePhone = settings.whatsapp || "";
      const gstin = settings.gstin || "";
      const placeOfSupplyState = (settings.placeOfSupplyState || "").trim();
      const customerState = (order.customer.state || "").trim();
      const isInterState = !!(placeOfSupplyState && customerState) &&
        placeOfSupplyState.toLowerCase() !== customerState.toLowerCase();
      const gstInclusive = settings.gstInclusive !== false;
      const isCancelled = order.status === "cancelled";
      const refund = order.cancellation?.refund;

      doc.fillColor(WINE).font("Helvetica-Bold").fontSize(20).text(displayName, 40, 40);
      doc.fillColor(GOLD).font("Helvetica").fontSize(8.5)
        .text("FINE HANDWOVEN SAREES & KURTIS", 40, 63, { characterSpacing: 1 });

      doc.fillColor(INK).font("Helvetica-Bold").fontSize(15)
        .text(isCancelled ? "CANCELLED — TAX INVOICE" : "TAX INVOICE", 340, 40, { width: 215, align: "right" });
      doc.fillColor(MUTED).font("Helvetica").fontSize(8.5)
        .text(`Invoice #: INV-${order.orderNumber}`, 340, 60, { width: 215, align: "right" })
        .text(`Order #: ${order.orderNumber}`, 340, 71, { width: 215, align: "right" })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, 340, 82, { width: 215, align: "right" })
        .text(`Payment: ${order.paymentStatus === "paid" ? "PAID" : "PENDING"}`, 340, 93, { width: 215, align: "right" });

      doc.moveTo(40, 112).lineTo(555, 112).strokeColor(GOLD).lineWidth(1).stroke();

      let y = 122;
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8.5).text("SOLD BY", 40, y);
      doc.fillColor(INK).font("Helvetica").fontSize(9);
      y += 12;
      doc.font("Helvetica-Bold").text(storeName, 40, y); y += 12;
      doc.font("Helvetica");
      if (storeAddress) { doc.text(storeAddress, 40, y, { width: 235 }); y += doc.heightOfString(storeAddress, { width: 235 }) + 1; }
      if (gstin) { doc.text(`GSTIN: ${gstin}`, 40, y); y += 12; }
      if (storeEmail) { doc.text(storeEmail, 40, y); y += 12; }
      if (storePhone) { doc.text(storePhone, 40, y); y += 12; }
      if (placeOfSupplyState) { doc.text(`Place of Supply: ${placeOfSupplyState}`, 40, y); y += 12; }

      let cy = 122;
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8.5).text("BILL TO / SHIP TO", 305, cy);
      doc.fillColor(INK).font("Helvetica").fontSize(9);
      cy += 12;
      doc.font("Helvetica-Bold").text(order.customer.name, 305, cy); cy += 12;
      doc.font("Helvetica");
      doc.text(order.customer.email, 305, cy); cy += 12;
      doc.text(order.customer.phone || "", 305, cy); cy += 12;
      if (order.customer.address) {
        const addrLine = `${order.customer.address}, ${order.customer.city || ""}${order.customer.state ? ", " + order.customer.state : ""} ${order.customer.pincode || ""}`;
        doc.text(addrLine, 305, cy, { width: 250 });
        cy += doc.heightOfString(addrLine, { width: 250 });
      }

      y = Math.max(y, cy) + 14;

      const colX = { item: 40, hsn: 205, qty: 255, rate: 288, taxable: 335, gst: 393, cgst: 435, sgst: 477, total: 515 };
      const tableRight = 555;

      doc.rect(40, y, tableRight - 40, 18).fill("#f7f2ea");
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7);
      doc.text("ITEM", colX.item + 2, y + 6, { width: 160 });
      doc.text("HSN", colX.hsn, y + 6, { width: 45, align: "center" });
      doc.text("QTY", colX.qty, y + 6, { width: 28, align: "center" });
      doc.text("RATE", colX.rate, y + 6, { width: 42, align: "right" });
      doc.text("TAXABLE", colX.taxable, y + 6, { width: 53, align: "right" });
      if (isInterState) {
        doc.text("IGST", colX.gst, y + 6, { width: 80, align: "right" });
      } else {
        doc.text("CGST", colX.cgst - 40, y + 6, { width: 40, align: "right" });
        doc.text("SGST", colX.sgst, y + 6, { width: 40, align: "right" });
      }
      doc.text("TOTAL", colX.total, y + 6, { width: 40, align: "right" });
      y += 18;

      doc.font("Helvetica").fontSize(8).fillColor(INK);
      let totalTaxable = 0, totalGst = 0, totalLine = 0;

      (order.items || []).forEach((item, i) => {
        const tax = computeItemTax(item, settings);
        totalTaxable += tax.taxable;
        totalGst += tax.gstAmount;
        totalLine += tax.lineTotal;

        const rowHeight = Math.max(doc.heightOfString(item.name, { width: 160 }) + 6, 16);
        if (i % 2 === 1) doc.rect(40, y, tableRight - 40, rowHeight).fill("#fbf8f3").fillColor(INK);

        doc.font("Helvetica").fontSize(8).fillColor(INK);
        doc.text(item.name, colX.item + 2, y + 3, { width: 160 });
        doc.text(item.hsnCode || settings.defaultHsnCode || "—", colX.hsn, y + 3, { width: 45, align: "center" });
        doc.text(String(item.qty), colX.qty, y + 3, { width: 28, align: "center" });
        doc.text(rupee(item.price), colX.rate, y + 3, { width: 42, align: "right" });
        doc.text(rupee(tax.taxable), colX.taxable, y + 3, { width: 53, align: "right" });

        if (isInterState) {
          doc.fontSize(6.5).text(`${rupee(tax.gstAmount)}\n(${tax.gstPct}%)`, colX.gst, y + 2, { width: 80, align: "right" });
        } else {
          const half = tax.gstAmount / 2;
          const halfPct = tax.gstPct / 2;
          doc.fontSize(6.5)
            .text(`${rupee(half)}\n(${halfPct}%)`, colX.cgst - 40, y + 2, { width: 40, align: "right" })
            .text(`${rupee(half)}\n(${halfPct}%)`, colX.sgst, y + 2, { width: 40, align: "right" });
        }

        doc.fontSize(8).font("Helvetica-Bold").text(rupee(tax.lineTotal), colX.total, y + 3, { width: 40, align: "right" });
        y += rowHeight;
      });

      doc.moveTo(40, y).lineTo(tableRight, y).strokeColor(LINE).lineWidth(0.5).stroke();
      y += 10;

      const totalsX = 350;
      doc.font("Helvetica").fontSize(9).fillColor(INK);

      const totalsRow = (label, value, opts = {}) => {
        doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.size || 9)
          .fillColor(opts.color || INK)
          .text(label, totalsX, y, { width: 110 })
          .text(value, totalsX + 110, y, { width: 95, align: "right" });
        y += opts.size ? opts.size + 5 : 14;
      };

      totalsRow("Taxable Value", rupee(totalTaxable));
      if (isInterState) {
        totalsRow(`IGST`, rupee(totalGst));
      } else {
        totalsRow(`CGST`, rupee(totalGst / 2));
        totalsRow(`SGST`, rupee(totalGst / 2));
      }
      if (order.shipping > 0) totalsRow("Shipping", rupee(order.shipping));
      if (order.discount > 0) totalsRow(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, `-${rupee(order.discount)}`, { color: "#2f6e4e" });

      y += 3;
      doc.moveTo(totalsX, y).lineTo(tableRight, y).strokeColor(GOLD).lineWidth(1).stroke();
      y += 8;
      totalsRow("Grand Total", rupee(order.total), { bold: true, size: 13, color: WINE });

      if (isCancelled && refund) {
        totalsRow("Refund Status", refund.status === "processed" ? "Refunded" : "Pending / Manual", { color: "#a23838" });
        if (refund.status === "processed") {
          totalsRow("Refunded Amount", rupee(refund.amount), { color: "#a23838" });
        }
      }

      y += 10;

      doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(MUTED)
        .text(
          `GST calculated as ${gstInclusive ? "inclusive of" : "exclusive of, added on top of"} listed price. ` +
          `${isInterState ? "Inter-state supply — IGST applicable." : "Intra-state supply — CGST + SGST applicable."}`,
          40, y, { width: 515 }
        );
      y += 20;

      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
      doc.text(`Payment Method: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (Online)"}`, 40, y);
      y += 12;
      doc.text(`Payment Status: ${order.paymentStatus === "paid" ? "Paid in full" : "Pending"}`, 40, y);
      if (order.razorpayPaymentId) { y += 12; doc.text(`Transaction ID: ${order.razorpayPaymentId}`, 40, y); }
      if (isCancelled) { y += 12; doc.fillColor("#a23838").text(`Order Cancelled${order.cancellation?.reviewedAt ? " on " + new Date(order.cancellation.reviewedAt).toLocaleDateString("en-IN") : ""}`, 40, y); }

      if (settings.invoiceTerms) {
        y += 24;
        doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("TERMS & CONDITIONS", 40, y);
        y += 11;
        doc.font("Helvetica").fontSize(7.5).fillColor(MUTED).text(settings.invoiceTerms, 40, y, { width: 515 });
      }

      doc.font("Helvetica").fontSize(7.5).fillColor(MUTED)
        .text(
          `This is a computer-generated invoice from ${displayName}. For queries, contact ${storeEmail || storePhone || "the seller"}.`,
          40, 772, { width: 515, align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF, computeItemTax };

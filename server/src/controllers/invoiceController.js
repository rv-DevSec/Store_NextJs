const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const { AppError } = require('../middlewares/errorHandler');

const fontPath = path.resolve(__dirname, '../../fonts/Vazirmatn-Regular.ttf');

const toPersianNum = (n) => {
  const digits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, (d) => digits[+d]);
};

const formatPrice = (n) => toPersianNum(Number(n).toLocaleString());

function drawTable(doc, headers, rows, startY, opts = {}) {
  const { colWidths, margin = 40, pageWidth = 595 } = opts;
  const tableWidth = pageWidth - margin * 2;
  const headerBg = '#2c3e50';
  const headerColor = '#ffffff';
  const borderColor = '#dcdcdc';
  const rowColors = ['#ffffff', '#f8f9fa'];
  const cellPad = 6;
  const lineHeight = 20;

  // column widths from right to left (RTL)
  const widths = colWidths || rows.length > 0
    ? Array(headers.length).fill(tableWidth / headers.length)
    : [];

  const rowHeight = lineHeight;

  function drawCell(text, x, y, w, h, color, txtColor, align) {
    doc.rect(x, y, w, h).fill(color);
    doc.fillColor(txtColor || '#333');
    const pad = cellPad;
    const txtX = align === 'right'
      ? x + w - pad
      : align === 'center'
        ? x + w / 2
        : x + pad;
    doc.text(text, txtX, y + h / 2 - 4, {
      width: w - pad * 2,
      align: align || 'right',
    });
    doc.fillColor('#000');
  }

  // header
  let curX = margin;
  doc.fontSize(10).font('Vazir');
  headers.forEach((h, i) => {
    drawCell(h, curX, startY, widths[i], rowHeight, headerBg, headerColor, 'center');
    curX += widths[i];
  });
  doc.rect(margin, startY, tableWidth, rowHeight).stroke(borderColor);

  // rows
  let y = startY + rowHeight;
  rows.forEach((row, ri) => {
    curX = margin;
    const bg = rowColors[ri % 2];
    row.forEach((cell, ci) => {
      const align = ci === 0 ? 'center' : ci === 1 ? 'right' : 'center';
      drawCell(cell, curX, y, widths[ci], rowHeight, bg, '#333', align);
      curX += widths[ci];
    });
    doc.rect(margin, y, tableWidth, rowHeight).stroke(borderColor);
    y += rowHeight;
  });

  return y;
}

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('items.product', 'name')
      .lean();

    if (!order) return next(new AppError('سفارش یافت نشد', 404));
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('دسترسی غیرمجاز', 403));
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'portrait' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });

    if (fs.existsSync(fontPath)) {
      doc.registerFont('Vazir', fontPath);
      doc.font('Vazir');
    } else {
      doc.font('Helvetica');
    }

    // ---------- header ----------
    doc.fontSize(22).fillColor('#2c3e50')
      .text('فاکتور فروش', { align: 'center' });
    doc.moveDown(0.5);

    // separator line
    doc.moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor('#2c3e50')
      .lineWidth(2)
      .stroke();
    doc.moveDown(0.5);

    // ---------- order info (RTL) ----------
    doc.fontSize(10).fillColor('#555');
    const rightX = 555;
    const infoLines = [
      `شماره سفارش: ${order._id.toString().slice(-8)}`,
      `تاریخ: ${new Date(order.createdAt).toLocaleDateString('fa-IR')}`,
      `مشتری: ${order.user.name}`,
      `تلفن: ${order.user.phone || '—'}`,
      `ایمیل: ${order.user.email || '—'}`,
    ];

    let infoY = doc.y;
    const infoLeftX = 40;
    infoLines.forEach((line, i) => {
      doc.text(line, infoLeftX, infoY + i * 15, { width: 250, align: 'right' });
    });
    infoY += infoLines.length * 15 + 5;

    doc.moveDown(1);

    // ---------- shipping ----------
    doc.fontSize(11).fillColor('#2c3e50')
      .text('مشخصات ارسال', { align: 'right' });
    doc.fontSize(10).fillColor('#555');
    doc.text(
      `آدرس: ${order.shippingAddress.province}، ${order.shippingAddress.city}، ${order.shippingAddress.fullAddress}`,
      { align: 'right' }
    );
    doc.text(`کد پستی: ${order.shippingAddress.postalCode}`, { align: 'right' });
    doc.moveDown(1);

    // ---------- table ----------
    doc.fontSize(12).fillColor('#2c3e50')
      .text('جزئیات سفارش', { align: 'right' });
    doc.moveDown(0.3);

    const headers = ['ردیف', 'نام محصول', 'تعداد', 'قیمت واحد', 'مجموع'];
    const colWidths = [35, 250, 55, 100, 100];
    const tableMargin = 40;
    const tableStartY = doc.y + 5;

    const rows = (order.items || []).map((item, i) => [
      toPersianNum(i + 1),
      String(item.product?.name || item.name || ''),
      toPersianNum(item.qty || 0),
      formatPrice(item.price || 0),
      formatPrice((item.price || 0) * (item.qty || 0)),
    ]);

    const endY = drawTable(doc, headers, rows, tableStartY, {
      colWidths,
      margin: tableMargin,
    });

    doc.y = endY + 20;

    // ---------- summary (RTL block) ----------
    const subtotal = (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
    const summaryLines = [
      ['مبلغ کل:', `${formatPrice(subtotal)} تومان`],
    ];
    if (order.discountAmount > 0) {
      summaryLines.push(['تخفیف:', `${formatPrice(order.discountAmount)} تومان`]);
    }
    summaryLines.push(
      ['مبلغ نهایی:', `${formatPrice(order.totalAmount || 0)} تومان`],
      ['وضعیت پرداخت:', order.paymentStatus === 'paid' ? 'پرداخت شده' : 'پرداخت نشده'],
      ['وضعیت سفارش:', order.status === 'delivered' ? 'تحویل شده' : order.status === 'cancelled' ? 'لغو شده' : 'در حال پردازش'],
    );

    // draw summary as a right-aligned block with border
    const summaryBoxX = 310;
    const summaryBoxW = 245;
    const summaryY = doc.y;
    const summaryRowH = 20;

    // box border
    doc.rect(summaryBoxX, summaryY, summaryBoxW, summaryLines.length * summaryRowH + 10)
      .strokeColor('#bdc3c7')
      .lineWidth(1)
      .stroke();

    // header bar inside summary
    doc.rect(summaryBoxX, summaryY, summaryBoxW, 24).fill('#34495e');
    doc.fillColor('#fff').fontSize(11)
      .text('خلاصه فاکتور', summaryBoxX, summaryY + 5, {
        width: summaryBoxW, align: 'center',
      });

    doc.fillColor('#333').fontSize(10);
    summaryLines.forEach(([label, value], i) => {
      const ly = summaryY + 28 + i * summaryRowH;
      const isLast = i === summaryLines.length - 1;
      if (isLast) doc.font('Vazir').fontSize(11).fillColor('#2c3e50');
      doc.text(label, summaryBoxX + 8, ly, { width: 100, align: 'right' });
      doc.text(value, summaryBoxX + 8, ly, { width: summaryBoxW - 16, align: 'left' });
      if (isLast) doc.fillColor('#333').fontSize(10);
    });

    // ---------- footer ----------
    const bottomY = summaryY + 30 + summaryLines.length * summaryRowH + 20;
    if (bottomY < 700) doc.y = bottomY;
    else doc.y = 700;

    doc.moveTo(40, doc.y).lineTo(555, doc.y)
      .strokeColor('#bdc3c7')
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#999')
      .text('این فاکتور توسط فروشگاه اینترنتی قطعات خودرو صادر شده است.', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

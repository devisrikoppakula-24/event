const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Configure email transporter (update with your credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-password'
  }
});

// ✅ Get Invoice by ID
router.get('/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate('customer', 'name email phone')
      .populate('booking')
      .populate('payment');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check authorization
    if (invoice.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this invoice' });
    }

    res.json(invoice);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ message: 'Error fetching invoice: ' + err.message });
  }
});

// ✅ Get Invoice by Booking ID
router.get('/booking/:bookingId', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ booking: req.params.bookingId })
      .populate('customer', 'name email phone')
      .populate('booking')
      .populate('payment');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ message: 'Error fetching invoice: ' + err.message });
  }
});

// ✅ Get All Invoices for User
router.get('/user/invoices', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.user.id })
      .sort({ invoiceDate: -1 })
      .populate('booking', 'eventType eventDate')
      .populate('payment', 'amount status');

    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: 'Error fetching invoices: ' + err.message });
  }
});

// ✅ Generate PDF Invoice
const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice_${invoice.invoiceNumber}.pdf`;
      const filepath = path.join(__dirname, '../invoices', filename);

      // Ensure invoices directory exists
      const dir = path.join(__dirname, '../invoices');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text('Event Planning Platform', 50, 80);
      doc.text('Email: support@eventplanning.com', 50, 95);
      doc.text('Phone: +91 9876543210', 50, 110);

      // Invoice Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000');
      doc.text(`Invoice No.: ${invoice.invoiceNumber}`, 350, 50);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 350, 70);
      doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, 350, 85);

      // Customer Info
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Bill To:', 50, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text(`${invoice.customerInfo?.name || 'N/A'}`, 50, 170);
      doc.text(`${invoice.customerInfo?.email || 'N/A'}`, 50, 185);
      doc.text(`${invoice.customerInfo?.phone || 'N/A'}`, 50, 200);

      // Event Details
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Event Details:', 350, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Event: ${invoice.eventDetails?.eventType?.toUpperCase()}`, 350, 170);
      doc.text(`Date: ${new Date(invoice.eventDetails?.eventDate).toLocaleDateString('en-IN')}`, 350, 185);
      doc.text(`Venue: ${invoice.eventDetails?.venueName || 'N/A'}`, 350, 200);

      // Line Items Table
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Items:', 50, 240);

      const tableTop = 260;
      const col1 = 50;
      const col2 = 300;
      const col3 = 400;
      const col4 = 500;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', col1, tableTop);
      doc.text('Qty', col2, tableTop);
      doc.text('Unit Price', col3, tableTop);
      doc.text('Total', col4, tableTop);

      doc.moveTo(col1, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      let y = tableTop + 30;
      invoice.lineItems?.forEach(item => {
        doc.fontSize(10).font('Helvetica').fillColor('#000');
        doc.text(item.description, col1, y);
        doc.text(item.quantity.toString(), col2, y);
        doc.text(`₹${item.unitPrice?.toLocaleString('en-IN')}`, col3, y);
        doc.text(`₹${item.totalPrice?.toLocaleString('en-IN')}`, col4, y);
        y += 20;
      });

      doc.moveTo(col1, y).lineTo(550, y).stroke();
      y += 10;

      // Summary
      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', col3, y);
      doc.text(`₹${invoice.subtotal?.toLocaleString('en-IN')}`, col4, y);
      y += 15;

      if (invoice.taxAmount > 0) {
        doc.text(`Tax (GST @ ${invoice.taxRate}%):`, col3, y);
        doc.text(`₹${invoice.taxAmount?.toLocaleString('en-IN')}`, col4, y);
        y += 15;
      }

      if (invoice.discountAmount > 0) {
        doc.text('Discount:', col3, y);
        doc.text(`-₹${invoice.discountAmount?.toLocaleString('en-IN')}`, col4, y);
        y += 15;
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total:', col3, y);
      doc.text(`₹${invoice.totalAmount?.toLocaleString('en-IN')}`, col4, y);

      // Footer
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text('Thank you for your business!', 50, 750);
      doc.text('This is a computer generated invoice.', 50, 765);

      doc.end();

      stream.on('finish', () => resolve(filepath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

// ✅ Generate Invoice PDF
router.post('/:invoiceId/generate-pdf', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfPath = await generateInvoicePDF(invoice);
    const filename = `invoice_${invoice.invoiceNumber}.pdf`;

    // Update invoice with PDF path
    invoice.invoicePdfPath = pdfPath;
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice PDF generated',
      pdfPath: pdfPath,
      filename: filename
    });
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ message: 'Error generating PDF: ' + err.message });
  }
});

// ✅ Download Invoice PDF
router.get('/:invoiceId/download', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Generate PDF if not already generated
    let pdfPath = invoice.invoicePdfPath;
    if (!pdfPath) {
      pdfPath = await generateInvoicePDF(invoice);
      invoice.invoicePdfPath = pdfPath;
      await invoice.save();
    }

    const filename = `invoice_${invoice.invoiceNumber}.pdf`;
    res.download(pdfPath, filename);
  } catch (err) {
    console.error('Error downloading invoice:', err);
    res.status(500).json({ message: 'Error downloading invoice: ' + err.message });
  }
});

// ✅ Send Invoice via Email
router.post('/:invoiceId/send-email', authMiddleware, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate('customer', 'name email phone');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Generate PDF if not already generated
    let pdfPath = invoice.invoicePdfPath;
    if (!pdfPath) {
      pdfPath = await generateInvoicePDF(invoice);
      invoice.invoicePdfPath = pdfPath;
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} - Event Booking Payment Confirmation`,
      html: `
        <h2>Invoice for Your Event Booking</h2>
        <p>Dear ${invoice.customer.name},</p>
        <p>Thank you for your booking! Please find your invoice attached.</p>
        <p><strong>Invoice Details:</strong></p>
        <ul>
          <li>Invoice Number: ${invoice.invoiceNumber}</li>
          <li>Total Amount: ₹${invoice.totalAmount?.toLocaleString('en-IN')}</li>
          <li>Event Date: ${new Date(invoice.eventDetails?.eventDate).toLocaleDateString('en-IN')}</li>
          <li>Event Type: ${invoice.eventDetails?.eventType}</li>
        </ul>
        <p>If you have any questions, please contact us at support@eventplanning.com</p>
        <p>Best regards,<br/>Event Planning Platform Team</p>
      `,
      attachments: [
        {
          filename: `invoice_${invoice.invoiceNumber}.pdf`,
          path: pdfPath
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    // Update sentAt
    invoice.sentAt = new Date();
    invoice.status = 'sent';
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice sent to email'
    });
  } catch (err) {
    console.error('Error sending invoice:', err);
    res.status(500).json({ message: 'Error sending invoice: ' + err.message });
  }
});

// ✅ Update Invoice Status
router.patch('/:invoiceId/status', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.invoiceId,
      {
        status: status,
        notes: notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({
      success: true,
      message: 'Invoice status updated',
      invoice: invoice
    });
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({ message: 'Error updating invoice: ' + err.message });
  }
});

module.exports = router;

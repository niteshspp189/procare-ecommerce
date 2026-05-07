import nodemailer from "nodemailer"
let PDFDocument: any
try {
  PDFDocument = require("pdfkit")
} catch (e) {
  console.error("[EmailService] pdfkit not found. PDF generation will be disabled.")
}
import { HttpTypes } from "@medusajs/types"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  if (!PDFDocument) {
    throw new Error("PDF generation library (pdfkit) is not installed. Please run 'npm install pdfkit' in the backend.")
  }
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const buffers: Buffer[] = []

    doc.on("data", (chunk) => buffers.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(buffers)))
    doc.on("error", (err) => reject(err))

    // Header
    doc.fillColor("#444444").fontSize(20).text("INVOICE", 50, 50)
    doc.fillColor("#00bda5").fontSize(10).text("ProCare Store", 200, 50, { align: "right" })
    doc.fillColor("#444444").text("MV Shoe Care Pvt Ltd", 200, 65, { align: "right" })
    doc.text("New Delhi, India", 200, 80, { align: "right" })

    doc.moveDown()
    doc.strokeColor("#eeeeee").lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke()

    // Order Info
    doc.fontSize(10).text(`Order Number: OD${(order.display_id || order.id).toString().padStart(8, '0')}`, 50, 130)
    
    const d = new Date(order.created_at)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const formattedDate = `${d.getDate()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`
    doc.text(`Order Date: ${formattedDate}`, 50, 145)
    doc.text(`Email: ${order.email}`, 50, 160)

    // Billing/Shipping
    doc.fontSize(12).text("Shipping Address", 50, 190)
    doc.fontSize(10).text(`${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`, 50, 210)
    doc.text(`${order.shipping_address?.address_1 || ''}`, 50, 225)
    doc.text(`${order.shipping_address?.city || ''}, ${order.shipping_address?.province || ''} ${order.shipping_address?.postal_code || ''}`, 50, 240)
    doc.text(`${order.shipping_address?.country_code?.toUpperCase() || ''}`, 50, 255)

    // Table Header
    const tableTop = 300
    doc.fontSize(10).font("Helvetica-Bold")
    doc.text("Item", 50, tableTop)
    doc.text("Quantity", 280, tableTop, { width: 90, align: "right" })
    doc.text("Unit Price", 370, tableTop, { width: 90, align: "right" })
    doc.text("Total", 460, tableTop, { width: 90, align: "right" })

    doc.strokeColor("#eeeeee").lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke()
    doc.font("Helvetica")

    // Items
    let i = 0
    let currentY = tableTop + 30
    let subtotalValue = 0
    for (const item of order.items || []) {
      const itemTotal = (item.unit_price || 0) * (item.quantity || 0)
      subtotalValue += itemTotal
      
      doc.text(item.title || "Unknown Product", 50, currentY)
      doc.text((item.quantity || 0).toString(), 280, currentY, { width: 90, align: "right" })
      doc.text(`${((item.unit_price || 0) / 100).toFixed(2)}`, 370, currentY, { width: 90, align: "right" })
      doc.text(`${(itemTotal / 100).toFixed(2)}`, 460, currentY, { width: 90, align: "right" })
      
      currentY += 20
      i++
    }

    // Totals
    const totalsY = currentY + 30
    doc.strokeColor("#eeeeee").lineWidth(1).moveTo(350, totalsY - 10).lineTo(550, totalsY - 10).stroke()
    
    // Subtotal
    doc.text("Subtotal:", 350, totalsY, { width: 100, align: "right" })
    doc.text(`${(subtotalValue / 100).toFixed(2)}`, 450, totalsY, { width: 100, align: "right" })
    
    // Shipping
    const shippingTotal = order.shipping_total || 0
    doc.text("Shipping:", 350, totalsY + 15, { width: 100, align: "right" })
    doc.text(`${(shippingTotal / 100).toFixed(2)}`, 450, totalsY + 15, { width: 100, align: "right" })

    // Taxes
    const taxTotal = order.tax_total || 0
    doc.text("Taxes:", 350, totalsY + 30, { width: 100, align: "right" })
    doc.text(`${(taxTotal / 100).toFixed(2)}`, 450, totalsY + 30, { width: 100, align: "right" })

    // Total
    const finalTotal = order.total || (subtotalValue + shippingTotal + taxTotal)
    doc.font("Helvetica-Bold")
    doc.text("Total:", 350, totalsY + 50, { width: 100, align: "right" })
    doc.text(`INR ${(finalTotal / 100).toFixed(2)}`, 450, totalsY + 50, { width: 100, align: "right" })

    // Footer
    doc.fontSize(10).fillColor("#999999").text("Thank you for your purchase!", 50, 700, { align: "center", width: 500 })

    doc.end()
  })
}

export async function sendOrderConfirmationEmail(order: any) {
  try {
    let pdfBuffer: Buffer | null = null
    try {
        pdfBuffer = await generateInvoicePDF(order)
    } catch (e) {
        console.warn("[EmailService] Continuing without PDF attachment:", e)
    }
    
    const d = new Date(order.created_at)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const formattedDate = `${d.getDate()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`
    const formattedId = `OD${(order.display_id || order.id).toString().padStart(8, '0')}`

    const mailOptions: any = {
      from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM}>`,
      to: order.email,
      subject: `Order Confirmation #${formattedId} - ProCare Store`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #00bda5;">Thank You for Your Order!</h2>
          <p>Hello,</p>
          <p>Your order <strong>#${formattedId}</strong> has been placed successfully on ${formattedDate}.</p>
          ${pdfBuffer ? `<p>We've attached your invoice to this email for your records.</p>` : `<p>Your invoice will be available in your dashboard shortly.</p>`}
          <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 10px;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p>Total: <strong>INR ${(order.total / 100).toFixed(2)}</strong></p>
            <p>Shipping to: ${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}</p>
          </div>
          <p>You can track your order status in your account dashboard.</p>
          <a href="${process.env.STORE_URL || 'http://shop.mvshoecare.com'}/account/orders" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 10px;">View Order Status</a>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">© 2026 ProCare Store. All rights reserved.</p>
        </div>
      `,
    }

    if (pdfBuffer) {
        mailOptions.attachments = [
            {
              filename: `Invoice_${formattedId}.pdf`,
              content: pdfBuffer,
            },
        ]
    }

    return await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error("[EmailService] Failed to send order confirmation:", error)
    throw error
  }
}

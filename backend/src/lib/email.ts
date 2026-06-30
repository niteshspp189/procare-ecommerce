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
    doc.fillColor("#444444").fontSize(20).font("Helvetica-Bold").text("INVOICE", 50, 50)
    doc.fillColor("#000000").fontSize(16).text("PRO", 200, 50, { align: "right" })
    doc.fillColor("#666666").fontSize(10).font("Helvetica").text("MV Shoe Care Pvt Ltd", 200, 68, { align: "right" })
    doc.text("A-13, Sector – 59, Noida, UP 201301, India", 200, 82, { align: "right" })

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
      from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM || 'team@webclixs.in'}>`,
      to: order.email,
      subject: `Order Confirmation #${formattedId} - ProCare Store`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
          <!-- Brand Header -->
          <div style="background-color: #000000; padding: 28px 24px; text-align: center; border-bottom: 3px solid #0bb799;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 3px;">PRO</h1>
          </div>
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Thank You for Your Order!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your order <strong style="color: #0f172a;">#${formattedId}</strong> has been placed successfully on ${formattedDate}.</p>
            ${pdfBuffer ? `<p style="color: #334155; font-size: 15px; line-height: 1.6;">We've attached your official invoice to this email for your records.</p>` : `<p style="color: #334155; font-size: 15px; line-height: 1.6;">Your invoice will be available in your dashboard shortly.</p>`}
            
            <div style="background: #f8fafc; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Order Summary</h3>
              <p style="margin: 8px 0; color: #475569; font-size: 14px;">Total Amount: <strong style="color: #0f172a; font-size: 16px;">INR ${(order.total / 100).toFixed(2)}</strong></p>
              <p style="margin: 8px 0; color: #475569; font-size: 14px;">Shipping To: <strong style="color: #334155;">${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}</strong></p>
            </div>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">You can track your shipping and order status anytime in your account dashboard.</p>
            <div style="text-align: center; margin: 28px 0 10px 0;">
              <a href="${process.env.STORE_URL || 'https://propremiumcare.com'}/account/orders" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">View Order Status</a>
            </div>
          </div>
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">© 2026 ProCare Store • MV Shoe Care Pvt Ltd. All rights reserved.</p>
          </div>
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

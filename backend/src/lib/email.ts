import nodemailer from "nodemailer"
import PDFDocument from "pdfkit"
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
    doc.fontSize(10).text(`Order Number: ${order.display_id || order.id}`, 50, 130)
    doc.text(`Order Date: ${new Date(order.created_at).toLocaleDateString()}`, 50, 145)
    doc.text(`Email: ${order.email}`, 50, 160)

    // Billing/Shipping
    doc.fontSize(12).text("Shipping Address", 50, 190)
    doc.fontSize(10).text(`${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`, 50, 210)
    doc.text(`${order.shipping_address?.address_1}`, 50, 225)
    doc.text(`${order.shipping_address?.city}, ${order.shipping_address?.province} ${order.shipping_address?.postal_code}`, 50, 240)
    doc.text(`${order.shipping_address?.country_code?.toUpperCase()}`, 50, 255)

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
    for (const item of order.items || []) {
      doc.text(item.title, 50, currentY)
      doc.text(item.quantity.toString(), 280, currentY, { width: 90, align: "right" })
      doc.text(`${(item.unit_price / 100).toFixed(2)}`, 370, currentY, { width: 90, align: "right" })
      doc.text(`${((item.unit_price * item.quantity) / 100).toFixed(2)}`, 460, currentY, { width: 90, align: "right" })
      
      currentY += 20
      i++
    }

    // Totals
    const subtotalY = currentY + 30
    doc.strokeColor("#eeeeee").lineWidth(1).moveTo(350, subtotalY - 10).lineTo(550, subtotalY - 10).stroke()
    
    doc.text("Subtotal:", 350, subtotalY, { width: 100, align: "right" })
    doc.text(`${(order.total / 100).toFixed(2)}`, 450, subtotalY, { width: 100, align: "right" })
    
    doc.font("Helvetica-Bold")
    doc.text("Total:", 350, subtotalY + 20, { width: 100, align: "right" })
    doc.text(`${(order.total / 100).toFixed(2)}`, 450, subtotalY + 20, { width: 100, align: "right" })

    // Footer
    doc.fontSize(10).fillColor("#999999").text("Thank you for your purchase!", 50, 700, { align: "center", width: 500 })

    doc.end()
  })
}

export async function sendOrderConfirmationEmail(order: any) {
  try {
    const pdfBuffer = await generateInvoicePDF(order)
    
    const mailOptions = {
      from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM}>`,
      to: order.email,
      subject: `Order Confirmation #${order.display_id || order.id} - ProCare Store`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #00bda5;">Thank You for Your Order!</h2>
          <p>Hello,</p>
          <p>Your order <strong>#${order.display_id || order.id}</strong> has been placed successfully.</p>
          <p>We've attached your invoice to this email for your records.</p>
          <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 10px;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p>Total: <strong>INR ${(order.total / 100).toFixed(2)}</strong></p>
            <p>Shipping to: ${order.shipping_address?.first_name} ${order.shipping_address?.last_name}</p>
          </div>
          <p>You can track your order status in your account dashboard.</p>
          <a href="${process.env.STORE_URL || 'http://shop.mvshoecare.com'}/account/orders" style="display: inline-block; background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 10px;">View Order Status</a>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">© 2026 ProCare Store. All rights reserved.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${order.display_id || order.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    }

    return await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error("[EmailService] Failed to send order confirmation:", error)
    throw error
  }
}

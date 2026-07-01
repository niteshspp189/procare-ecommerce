import nodemailer from "nodemailer"
import path from "path"

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
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const buffers: Buffer[] = []

    doc.on("data", (chunk) => buffers.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(buffers)))
    doc.on("error", (err) => reject(err))

    const width = doc.page.width

    const fontBoldPath = path.join(process.cwd(), "public", "KelsonSans-Bold.otf")
    const fontRegPath = path.join(process.cwd(), "public", "KelsonSans-Regular.otf")
    let KELSON_BOLD = "Helvetica-Bold"
    let KELSON_REGULAR = "Helvetica"
    try {
      doc.registerFont('Kelson-Bold', fontBoldPath)
      doc.registerFont('Kelson-Regular', fontRegPath)
      KELSON_BOLD = "Kelson-Bold"
      KELSON_REGULAR = "Kelson-Regular"
    } catch (e) {
      console.warn("Kelson fonts not found, using Helvetica")
    }


    // Logo (Centered Top)
    try {
      doc.image(path.join(process.cwd(), "public", "logo.png"), (width - 100) / 2, 40, { width: 100 })
    } catch(e) {
      // fallback if logo not found
      doc.fillColor("#000").fontSize(24).font(KELSON_BOLD).text("PRO>", 0, 40, { align: "center" })
    }

    // TAX INVOICE Title
    doc.y = 120
    doc.fillColor("#000000").fontSize(14).font(KELSON_BOLD).text("TAX INVOICE", 0, 120, { align: "center" })
    doc.moveDown(0.5)
    doc.strokeColor("#000000").lineWidth(1).moveTo(40, doc.y).lineTo(width - 40, doc.y).stroke()
    doc.moveDown(1)

    const sectionY = doc.y

    // 1. SHIPPING ADDRESS
    doc.fontSize(8).font(KELSON_BOLD).text("SHIPPING ADDRESS:", 40, sectionY)
    doc.font(KELSON_REGULAR)
    const addr = order.shipping_address || {}
    doc.text(`${addr.first_name || ''} ${addr.last_name || ''}`, 40, doc.y + 5)
    if (addr.address_1) doc.text(addr.address_1)
    if (addr.address_2) doc.text(addr.address_2)
    if (addr.city || addr.province) doc.text(`${addr.city || ''}, ${addr.province || ''} ${addr.postal_code || ''}`)
    if (addr.country_code) doc.text(addr.country_code.toUpperCase())

    // 2. SOLD BY
    // Dotted borders
    doc.save()
    doc.strokeColor("#cccccc").lineWidth(0.5).dash(1, { space: 2 })
    doc.moveTo(190, sectionY - 5).lineTo(190, sectionY + 80).stroke()
    doc.moveTo(375, sectionY - 5).lineTo(375, sectionY + 80).stroke()
    doc.restore()

    doc.font(KELSON_BOLD).text("SOLD BY:", 200, sectionY)
    doc.font(KELSON_REGULAR)
    doc.text("M.V. Shoe Care Pvt. Ltd.", 200, doc.y + 5)
    doc.text("Sector 59, Noida, Uttar Pradesh, India", { lineGap: 1 })
    doc.text("A-13", { lineGap: 1 })
    doc.text("Gautam Buddha Nagar 201301", { lineGap: 1 })
    doc.text("Uttar Pradesh", { lineGap: 1 })
    doc.text("India", { lineGap: 1 })
    doc.text("State Code : 09", { lineGap: 1 })
    doc.text("Ph: 8588834954", { lineGap: 1 })
    doc.text("GSTIN No. 09AAFC M8351 G1Z9", { lineGap: 1 })
    doc.text("Website: http://www.propremiumcare.com", { lineGap: 1 })
    doc.text("Email: mktg2@mvscindia.com", { lineGap: 1 })
    const soldByMaxY = doc.y

    // 3. INVOICE DETAILS
    const d = new Date(order.created_at)
    const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`
    const formattedId = `OD${(order.display_id || order.id || '0001').toString().padStart(8, '0')}`
    
    doc.font(KELSON_BOLD).text("INVOICE DETAILS:", 380, sectionY)
    doc.font(KELSON_REGULAR)
    
    const detailsTop = doc.y + 5
    const labelX = 380
    const valueX = 460
    
    doc.text("INVOICE NO.", labelX, detailsTop)
    doc.text(`: ${formattedId}`, valueX, detailsTop)
    doc.text("INVOICE DATE", labelX, doc.y + 2)
    doc.text(`: ${formattedDate}`, valueX, doc.y - 9)
    doc.text("ORDER NO.", labelX, doc.y + 2)
    doc.text(`: ${formattedId}`, valueX, doc.y - 9)
    doc.text("ORDER DATE", labelX, doc.y + 2)
    doc.text(`: ${formattedDate}`, valueX, doc.y - 9)
    doc.text("CHANNEL", labelX, doc.y + 2)
    doc.text(`: Propremiumcare`, valueX, doc.y - 9)
    doc.text("PAYMENT METHOD", labelX, doc.y + 2)
    // simplistic check for payment method
    let payMethod = "Prepaid"
    if (order.payments && order.payments.length > 0) {
      if (order.payments[0].provider_id?.includes("cod") || order.payments[0].provider_id?.includes("manual")) {
        payMethod = "COD"
      }
    }
    doc.text(`: ${payMethod}`, valueX, doc.y - 9)

    doc.moveDown(3)

    // TABLE HEADERS
    const tableTop = Math.max(doc.y, soldByMaxY, sectionY + 120) + 15
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(40, tableTop).lineTo(width - 40, tableTop).stroke()
    
    const thY = tableTop + 5
    doc.fontSize(6).font(KELSON_BOLD)
    doc.text("S.NO.", 40, thY)
    doc.text("PRODUCT NAME", 70, thY)
    doc.text("HSN", 220, thY, { align: "center", width: 40 })
    doc.text("QTY", 260, thY, { align: "center", width: 30 })
    doc.text("UNIT PRICE", 290, thY, { align: "center", width: 50 })
    doc.text("UNIT DISCOUNT", 340, thY, { align: "center", width: 60 })
    doc.text("TAXABLE VALUE", 400, thY, { align: "center", width: 60 })
    doc.text("IGST (Value | %)", 460, thY, { align: "center", width: 50 })
    doc.text("TOTAL", 510, thY, { align: "right", width: 45 })

    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(40, thY + 12).lineTo(width - 40, thY + 12).stroke()
    
    // TABLE ROWS
    doc.font(KELSON_REGULAR)
    let currentY = thY + 20
    let subtotalValue = 0
    let i = 1

    for (const item of order.items || []) {
      const qty = item.quantity || 1
      const unitPrice = (item.unit_price || 0) / 100
      const discount = (item.discount_total || 0) / 100 / qty // approx per unit
      const tax = (item.tax_total || 0) / 100
      const taxRate = item.tax_rate || 18
      const taxable = (item.subtotal || ((unitPrice - discount) * qty * 100)) / 100
      const total = (item.total || ((taxable + tax) * 100)) / 100
      
      const hsn = item.variant?.sku || "34051000"
      
      subtotalValue += total
      
      doc.text(i.toString(), 40, currentY)
      doc.text(item.title || "Unknown Product", 70, currentY, { width: 140 })
      
      const titleHeight = doc.heightOfString(item.title || "Unknown Product", { width: 140, fontSize: 6 })
      
      doc.text(hsn, 220, currentY, { align: "center", width: 40 })
      doc.text(qty.toString(), 260, currentY, { align: "center", width: 30 })
      doc.text(unitPrice.toFixed(2), 290, currentY, { align: "center", width: 50 })
      doc.text(discount.toFixed(2), 340, currentY, { align: "center", width: 60 })
      doc.text(taxable.toFixed(2), 400, currentY, { align: "center", width: 60 })
      doc.text(`${tax.toFixed(2)} | ${taxRate}%`, 460, currentY, { align: "center", width: 50 })
      doc.text(total.toFixed(2), 510, currentY, { align: "right", width: 45 })
      
      currentY += Math.max(15, titleHeight + 5)
      i++
    }

    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(40, currentY).lineTo(width - 40, currentY).stroke()
    currentY += 5
    
    // Add Shipping if any
    let shippingFee = order.shipping_total ?? order.summary?.shipping_total ?? 0
    if (subtotalValue > 0 && subtotalValue < 499 && (!shippingFee || shippingFee === 0)) {
        shippingFee = 8000 // In case there's genuinely 0 in DB but we know it should have been charged
    }
    const finalShipping = shippingFee / 100
    if (finalShipping > 0) {
      doc.text("-", 40, currentY)
      doc.text("Shipping Fee", 70, currentY, { width: 140 })
      doc.text("-", 220, currentY, { align: "center", width: 40 })
      doc.text("1", 260, currentY, { align: "center", width: 30 })
      doc.text(finalShipping.toFixed(2), 290, currentY, { align: "center", width: 50 })
      doc.text("0.00", 340, currentY, { align: "center", width: 60 })
      doc.text(finalShipping.toFixed(2), 400, currentY, { align: "center", width: 60 })
      doc.text(`0.00 | 0%`, 460, currentY, { align: "center", width: 50 })
      doc.text(finalShipping.toFixed(2), 510, currentY, { align: "right", width: 45 })
      currentY += 15
      doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(40, currentY).lineTo(width - 40, currentY).stroke()
      currentY += 5
      subtotalValue += finalShipping
    }

    // NET TOTAL
    doc.font(KELSON_BOLD).fontSize(8)
    doc.text("NET TOTAL (In Value)", 340, currentY, { align: "right", width: 120 })
    doc.text(`Rs. ${subtotalValue.toFixed(2)}`, 510, currentY, { align: "right", width: 45 })
    currentY += 15
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(340, currentY).lineTo(width - 40, currentY).stroke()
    
    // REVERSE CHARGE TEXT
    currentY += 5
    doc.font(KELSON_REGULAR).fontSize(7)
    doc.text("Whether tax is payable under reverse charge- No", 380, currentY, { align: "right", width: 175 })
    
    // SIGNATURE BOX
    currentY += 30
    const sigWidth = 140
    const sigHeight = 50
    doc.strokeColor("#aaaaaa").lineWidth(1).rect(40, currentY, sigWidth, sigHeight).stroke()
    try {
      doc.image(path.join(process.cwd(), "public", "akumar-signature.png"), 45, currentY + 5, { fit: [sigWidth - 10, sigHeight - 10], align: 'center', valign: 'center' })
    } catch(e) {
      doc.fontSize(10).text("Akumar", 40, currentY + 20, { width: sigWidth, align: "center" })
    }
    
    doc.fontSize(7).fillColor("#333333").text("Authorized Signature for M.V. Shoe Care Pvt. Ltd.", 40, currentY + sigHeight + 15, { width: sigWidth })

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
    
    const d = new Date(order.created_at || Date.now())
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const formattedDate = `${d.getDate()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`
    const formattedId = `OD${(order.display_id || order.id || '0001').toString().padStart(8, '0')}`

    const itemsSubtotal = (order.items || []).reduce((acc: number, item: any) => {
      return acc + (item.unit_price || 0) * (item.quantity || 1)
    }, 0)
    let shippingFee = order.shipping_total ?? order.summary?.shipping_total ?? 0
    if (itemsSubtotal > 0 && itemsSubtotal < 49900 && (!shippingFee || shippingFee === 0)) {
      shippingFee = 8000
    }
    const rawTotal = order.total ?? order.summary?.total ?? (itemsSubtotal + shippingFee)
    const effectiveTotal = (rawTotal === itemsSubtotal && itemsSubtotal < 49900 && shippingFee === 8000)
      ? itemsSubtotal + 8000
      : rawTotal
    const displayTotalAmount = typeof effectiveTotal === "number" && !isNaN(effectiveTotal)
      ? (effectiveTotal / 100).toFixed(2)
      : "0.00"

    const storeUrl = process.env.STORE_URL || 'https://propremiumcare.com'

    const mailOptions: any = {
      from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM || 'team@webclixs.in'}>`,
      to: order.email,
      subject: `Order Confirmation #${formattedId} - ProCare Store`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
          <!-- Brand Header -->
          <div style="background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 3px solid #00bda5;">
            <a href="${storeUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
              <img src="${storeUrl}/images/logos/logo.png" alt="PRO" style="height: 48px; width: auto; max-width: 200px; display: inline-block; vertical-align: middle;" />
            </a>
          </div>
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; text-align: center;">Thank You for Your Order!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello ${order.shipping_address?.first_name || ''},</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Your order <strong style="color: #0f172a;">#${formattedId}</strong> has been placed successfully on ${formattedDate}.</p>
            ${pdfBuffer ? `<p style="color: #334155; font-size: 15px; line-height: 1.6;">We've attached your official invoice to this email for your records.</p>` : `<p style="color: #334155; font-size: 15px; line-height: 1.6;">Your invoice will be available in your dashboard shortly.</p>`}
            
            <div style="background: #f8fafc; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Order Summary</h3>
              <p style="margin: 8px 0; color: #475569; font-size: 14px;">Total Amount: <strong style="color: #0f172a; font-size: 16px;">INR ${displayTotalAmount}</strong></p>
              <p style="margin: 8px 0; color: #475569; font-size: 14px;">Shipping To: <strong style="color: #334155;">${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}</strong></p>
            </div>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">You can track your shipping and order status anytime in your account dashboard.</p>
            <div style="text-align: center; margin: 28px 0 10px 0;">
              <a href="${storeUrl}/account/orders" style="display: inline-block; background: #00bda5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">View Order Status</a>
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

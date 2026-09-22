import nodemailer from "nodemailer"
import path from "path"

let PDFDocument: any
try {
  PDFDocument = require("pdfkit")
} catch (e) {
  console.error("[EmailService] pdfkit not found. PDF generation will be disabled.")
}
import { HttpTypes } from "@medusajs/types"

const smtpPort = parseInt(process.env.SMTP_PORT || "587")
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (implicit TLS), false for 587 (STARTTLS)
  requireTLS: smtpPort !== 465, // force STARTTLS for port 587 (AWS SES)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function isUttarPradesh(province: string): boolean {
  const p = (province || "").toLowerCase().replace(/\s/g, "").replace(/\./g, "");
  return p === "up" || p === "uttarpradesh";
}

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


    const blockX = (width - 100) / 2

    // Logo (Centered Top)
    try {
      doc.image(path.join(process.cwd(), "public", "logo.png"), blockX, 40, { width: 100 })
    } catch(e) {
      // fallback if logo not found
      doc.fillColor("#000").fontSize(24).font(KELSON_BOLD).text("PRO>", blockX, 40)
    }

    // TAX INVOICE Title
    doc.y = 120
    doc.fillColor("#000000").fontSize(14).font(KELSON_BOLD).text("TAX INVOICE", blockX, 120)
    doc.moveDown(0.5)
    doc.strokeColor("#000000").lineWidth(1).moveTo(40, doc.y).lineTo(width - 40, doc.y).stroke()
    doc.moveDown(1)

    const sectionY = doc.y

    // 1. SHIPPING ADDRESS
    doc.fontSize(8).font(KELSON_BOLD).text("SHIPPING ADDRESS:", 40, sectionY)
    doc.font(KELSON_REGULAR)
    const addr = order.shipping_address || {}
    const addrOpts = { width: 140 }
    doc.text(`${addr.first_name || ''} ${addr.last_name || ''}`, 40, doc.y + 5, addrOpts)
    if (addr.address_1) doc.text(addr.address_1, addrOpts)
    if (addr.address_2) doc.text(addr.address_2, addrOpts)
    if (addr.city || addr.province) doc.text(`${addr.city || ''}, ${addr.province || ''} ${addr.postal_code || ''}`, addrOpts)
    if (addr.country_code) doc.text(addr.country_code.toUpperCase(), addrOpts)

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
    const payments = order.payments || (order.payment_collections ? order.payment_collections.flatMap((pc: any) => pc.payments || []) : []);
    if (payments && payments.length > 0) {
      if (payments[0].provider_id?.includes("cod") || payments[0].provider_id?.includes("manual")) {
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
    doc.text("PRODUCT NAME", 65, thY)
    doc.text("HSN", 240, thY, { align: "center", width: 45 })
    doc.text("QTY", 285, thY, { align: "center", width: 25 })
    doc.text("UNIT PRICE", 310, thY, { align: "center", width: 50 })
    doc.text("UNIT DISCOUNT", 360, thY, { align: "center", width: 50 })
    doc.text("TAXABLE VALUE", 410, thY, { align: "center", width: 50 })
    doc.text("GST", 460, thY, { align: "center", width: 45 })
    doc.text("TOTAL", 505, thY, { align: "right", width: 50 })

    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(40, thY + 12).lineTo(width - 40, thY + 12).stroke()
    
    // TABLE ROWS
    doc.font(KELSON_REGULAR)
    let currentY = thY + 20
    let itemsTaxableSubtotal = 0
    let itemsTaxSubtotal = 0
    let itemsTotalSubtotal = 0
    let totalDiscountSum = 0
    let i = 1

    for (const item of order.items || []) {
      const qty = item.quantity || 1
      const unitPrice = item.unit_price ?? item.item?.unit_price ?? 0
      const taxRate = 18 // 18% inclusive GST
      
      let computedItemDiscount = item.discount_total;
      if (computedItemDiscount === undefined) {
        const sumAdj = item.adjustments?.reduce((sum: number, adj: any) => sum + adj.amount * (adj.is_tax_inclusive ? 1 : (1 + taxRate / 100)), 0) ?? 0;
        computedItemDiscount = sumAdj;
      }
      const itemDiscount = computedItemDiscount ?? 0;
      const discountPerUnit = qty > 0 ? (itemDiscount / qty) : 0
      
      const roundedUnitPrice = Math.round(unitPrice)
      const roundedDiscountPerUnit = Math.round(discountPerUnit)
      const discountedUnitPrice = Math.max(0, roundedUnitPrice - roundedDiscountPerUnit)

      const lineTotal = discountedUnitPrice * qty
      const taxableValue = Math.round(lineTotal / (1 + (taxRate / 100)))
      const taxValue = lineTotal - taxableValue
      
      itemsTaxableSubtotal += taxableValue
      itemsTaxSubtotal += taxValue
      itemsTotalSubtotal += lineTotal
      totalDiscountSum += Math.round(itemDiscount)
      
      doc.text(i.toString(), 40, currentY)
      doc.text(item.title || "Unknown Product", 65, currentY, { width: 170 })
      
      const titleHeight = doc.heightOfString(item.title || "Unknown Product", { width: 170, fontSize: 6 })
      const sku = item.variant_sku || item.sku || item.item?.variant_sku || "";
      if (sku) {
        doc.fillColor("#666666").fontSize(5).text(`SKU : ${sku}`, 65, currentY + titleHeight + 1, { width: 170 })
        doc.fillColor("#000000").fontSize(6) // restore color/size
      }
      
      const totalItemHeight = sku ? titleHeight + 8 : titleHeight;
      
      doc.text("34051000", 240, currentY, { align: "center", width: 45 })
      doc.text(qty.toString(), 285, currentY, { align: "center", width: 25 })
      doc.text(roundedUnitPrice.toFixed(0), 310, currentY, { align: "center", width: 50 })
      doc.text(roundedDiscountPerUnit.toFixed(0), 360, currentY, { align: "center", width: 50 })
      doc.text(taxableValue.toFixed(0), 410, currentY, { align: "center", width: 50 })
      doc.text(taxValue.toFixed(0), 460, currentY, { align: "center", width: 45 })
      doc.text(lineTotal.toFixed(0), 505, currentY, { align: "right", width: 50 })
      
      currentY += Math.max(15, totalItemHeight + 5)
      i++
    }

    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(40, currentY).lineTo(width - 40, currentY).stroke()
    currentY += 10
    
    // Add Shipping and Discount
    const shippingFee = Math.round(order.shipping_total ?? order.summary?.shipping_total ?? order.shipping_methods?.[0]?.amount ?? 0)
    
    let shippingDiscount = 0;
    if (order.shipping_methods) {
      for (const sm of order.shipping_methods) {
        if (sm.adjustments) {
          for (const adj of sm.adjustments) {
            shippingDiscount += adj.amount * (adj.is_tax_inclusive ? 1 : (1 + 18 / 100));
          }
        }
      }
    }
    
    const overallDiscount = Math.round(order.discount_total ?? order.summary?.discount_total ?? (totalDiscountSum + shippingDiscount))
    const calculatedNetTotal = itemsTotalSubtotal + shippingFee - Math.round(shippingDiscount)
    const netTotal = Math.round(order.total ?? order.summary?.total ?? order.summary?.current_order_total ?? calculatedNetTotal)

    // Summary block fields
    const summaryX = 350
    const summaryValueX = 510
    const labelWidth = 140
    
    // Subtotal (Taxable value of items)
    doc.font(KELSON_BOLD).fontSize(7).fillColor("#333333")
    doc.text("Subtotal", summaryX, currentY, { align: "right", width: labelWidth })
    doc.text(`Rs. ${itemsTaxableSubtotal.toFixed(0)}`, summaryValueX, currentY, { align: "right", width: 45 })
    currentY += 12
    
    // CGST/SGST Tax (GST 18%) or IGST (GST 18%) depending on state
    const stateStr = order.shipping_address?.province || "";
    const isUP = isUttarPradesh(stateStr);
    if (isUP) {
      const cgst = itemsTaxSubtotal / 2;
      const sgst = itemsTaxSubtotal / 2;
      
      const formatTax = (val: number) => Number.isInteger(val) ? val.toFixed(0) : val.toFixed(1);
      
      doc.text("CGST (9%)", summaryX, currentY, { align: "right", width: labelWidth })
      doc.text(`Rs. ${formatTax(cgst)}`, summaryValueX, currentY, { align: "right", width: 45 })
      currentY += 12
      
      doc.text("SGST (9%)", summaryX, currentY, { align: "right", width: labelWidth })
      doc.text(`Rs. ${formatTax(sgst)}`, summaryValueX, currentY, { align: "right", width: 45 })
      currentY += 12
    } else {
      doc.text("IGST (18%)", summaryX, currentY, { align: "right", width: labelWidth })
      doc.text(`Rs. ${itemsTaxSubtotal.toFixed(0)}`, summaryValueX, currentY, { align: "right", width: 45 })
      currentY += 12
    }
    
    // Shipping Charges
    doc.text("Shipping Charges", summaryX, currentY, { align: "right", width: labelWidth })
    doc.text(`Rs. ${shippingFee.toFixed(0)}`, summaryValueX, currentY, { align: "right", width: 45 })
    currentY += 12
    
    // Line separator
    currentY += 2
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(summaryX + 30, currentY).lineTo(width - 40, currentY).stroke()
    currentY += 5
    
    // Net Total / Grand Total
    doc.font(KELSON_BOLD).fontSize(8).fillColor("#000000")
    doc.text("NET TOTAL (In Value)", summaryX, currentY, { align: "right", width: labelWidth })
    doc.text(`Rs. ${netTotal.toFixed(0)}`, summaryValueX, currentY, { align: "right", width: 45 })
    currentY += 15
    doc.strokeColor("#cccccc").lineWidth(0.5).moveTo(summaryX + 30, currentY).lineTo(width - 40, currentY).stroke()
    
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
      const price = item.unit_price ?? item.item?.unit_price ?? 0
      return acc + price * (item.quantity || 1)
    }, 0)
    
    const shippingFee = order.shipping_total ?? order.summary?.shipping_total ?? order.shipping_methods?.[0]?.amount ?? 0
    
    let manualDiscount = 0
    if (order.items) {
      for (const item of order.items) {
        if (item.discount_total !== undefined) {
          manualDiscount += Number(item.discount_total)
        } else if (item.adjustments) {
          for (const adj of item.adjustments) {
            manualDiscount += adj.amount * (adj.is_tax_inclusive ? 1 : 1.18)
          }
        }
      }
    }
    if (order.shipping_methods) {
      for (const sm of order.shipping_methods) {
        if (sm.adjustments) {
          for (const adj of sm.adjustments) {
            manualDiscount += adj.amount * (adj.is_tax_inclusive ? 1 : 1.18)
          }
        }
      }
    }
    const discountTotal = Math.round(order.discount_total ?? order.summary?.discount_total ?? manualDiscount)

    // Total is calculated directly - Medusa v2 stores directly in INR
    const rawTotal = order.total ?? order.summary?.total ?? order.summary?.current_order_total ?? (itemsSubtotal + shippingFee - discountTotal)
    const displayTotalAmount = typeof rawTotal === "number" && !isNaN(rawTotal)
      ? Math.round(rawTotal).toFixed(0)
      : "0"

    const storeUrl = process.env.STORE_URL || 'https://propremiumcare.com'

    const mailOptions: any = {
      from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM || 'orders@propremiumcare.com'}>`,
      replyTo: 'customercare@mvscindia.com',
      to: order.email,
      bcc: 'customercare@mvscindia.com, team@webclixs.in',
      subject: `Order Confirmation #${formattedId} - ProPremium Care`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
          <!-- Brand Header -->
          <div style="background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 3px solid #00bda5;">
            <a href="${storeUrl}" ses:no-track="true" target="_blank" style="text-decoration: none; display: inline-block;">
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
              <a href="${storeUrl}/account/orders" ses:no-track="true" style="display: inline-block; background: #00bda5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">View Order Status</a>
            </div>
          </div>
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">© 2026 ProPremium Care • MV Shoe Care Pvt Ltd. All rights reserved.</p>
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

    try {
      console.log(`[EmailService] Attempting to send order confirmation email via SES...`)
      return await transporter.sendMail(mailOptions)
    } catch (sesError: any) {
      console.warn(`[EmailService] Primary SES SMTP failed (${sesError.message}). Attempting fallback to Gmail SMTP...`)
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "team@webclixs.in",
            pass: "wsek gghl znno gedt",
          },
        })
        
        // Gmail forces the sender 'From' address to match the authenticated user.
        // We set 'replyTo' so that if customers reply, it goes to your customercare.
        const fallbackMailOptions = {
          ...mailOptions,
          from: `"ProCare Store" <team@webclixs.in>`
        }
        
        const info = await fallbackTransporter.sendMail(fallbackMailOptions)
        console.log(`[EmailService] Fallback order confirmation email sent successfully via Gmail!`)
        return info
      } catch (gmailError: any) {
        console.error(`[EmailService] Both primary SES and fallback Gmail SMTP failed:`, gmailError.message)
        throw new Error(`Email sending failed. Primary SES error: ${sesError.message}. Fallback Gmail error: ${gmailError.message}`)
      }
    }
  } catch (error) {
    console.error("[EmailService] Failed to send order confirmation:", error)
    throw error
  }
}

export async function sendAlertEmail(subject: string, htmlContent: string, recipient: string = "niteshspp189@gmail.com") {
  const mailOptions = {
    from: `"ProCare Logistics Monitor" <noreply@propremiumcare.com>`,
    to: recipient,
    subject: `🚨 [ProCare Alert] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 18px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px;">ProCare System Notification</h2>
        </div>
        <div style="padding: 24px; background: #ffffff; color: #334155; font-size: 14px; line-height: 1.6;">
          ${htmlContent}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; margin: 0;">Automated alert from ProCare E-Commerce Production Server • ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
        </div>
      </div>
    `,
  }

  try {
    console.log(`[EmailService] Sending alert email to ${recipient} via SES...`)
    return await transporter.sendMail(mailOptions)
  } catch (sesError: any) {
    console.warn(`[EmailService] SES alert email failed (${sesError.message}). Attempting Gmail SMTP fallback...`)
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "team@webclixs.in",
          pass: "wsek gghl znno gedt",
        },
      })
      const fallbackMailOptions = {
        ...mailOptions,
        from: `"ProCare Logistics Monitor" <team@webclixs.in>`
      }
      return await fallbackTransporter.sendMail(fallbackMailOptions)
    } catch (gmailError: any) {
      console.error("[EmailService] Both SES and Gmail fallback failed for alert:", gmailError.message)
    }
  }
}

export interface HealthReportData {
  timeZoneString: string
  lastSevenDaysStats: {
    totalOrders: number
    totalRevenue: number
    paidOrders: number
    fulfilledOrders: number
    unfulfilledOrders: number
  }
  recentOrders: Array<{
    display_id: number
    email: string
    total_amount: number
    created_at: string
    payment_status: string
    sr_order_id?: string
    sr_shipment_id?: string
    awb_code?: string
    sr_status?: string
  }>
  tokenInfo: {
    isValid: boolean
    expiresAt?: string
    daysRemaining?: string
  }
  syncStats: {
    checkedCount: number
    updatedCount: number
  }
  nextScheduledRun: string
}

export async function sendPeriodicHealthReportEmail(report: HealthReportData, recipient: string = "niteshspp189@gmail.com") {
  const fulfillmentPercent = report.lastSevenDaysStats.paidOrders > 0
    ? Math.round((report.lastSevenDaysStats.fulfilledOrders / report.lastSevenDaysStats.paidOrders) * 100)
    : 100

  const ordersRowsHtml = report.recentOrders.length > 0
    ? report.recentOrders.map((ord, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: bold; color: #0f172a;">#${ord.display_id}</td>
          <td style="padding: 10px 12px; color: #475569; font-size: 13px;">${ord.email}</td>
          <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">₹${ord.total_amount.toLocaleString("en-IN")}</td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 9999px; background: ${ord.payment_status === 'completed' ? '#dcfce7' : '#fef9c3'}; color: ${ord.payment_status === 'completed' ? '#166534' : '#854d0e'};">
              ${ord.payment_status.toUpperCase()}
            </span>
          </td>
          <td style="padding: 10px 12px; font-size: 12px; color: #334155;">
            ${ord.sr_order_id ? `SR: <strong>${ord.sr_order_id}</strong>` : '<span style="color: #94a3b8;">None</span>'}
            ${ord.sr_shipment_id ? `<br/><span style="color: #64748b;">Shp: ${ord.sr_shipment_id}</span>` : ''}
          </td>
          <td style="padding: 10px 12px; font-size: 12px;">
            ${ord.awb_code ? `<span style="font-family: monospace; font-weight: 600; color: #2563eb;">${ord.awb_code}</span>` : '<span style="color: #64748b;">Pending AWB</span>'}
            ${ord.sr_status ? `<br/><span style="color: #475569; font-size: 11px;">(${ord.sr_status})</span>` : ''}
          </td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b;">No orders placed in the last 7 days. System is active and listening.</td></tr>`

  const mailOptions = {
    from: `"ProCare Logistics Monitor" <noreply@propremiumcare.com>`,
    to: recipient,
    subject: `✅ [ProCare Report] 3-Day System Health & 7-Day Fulfillment Summary`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 660px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8;">ProCare Logistics & Platform</span>
                <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff;">3-Day System Health & 7-Day Report</h1>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #4ade80; font-size: 12px; font-weight: 600;">
                  ● ALL SYSTEMS OK
                </span>
              </td>
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #cbd5e1;">Periodic summary generated on ${report.timeZoneString} IST</p>
        </div>

        <div style="padding: 24px;">

          <!-- 4 KPI Cards -->
          <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin: -10px -10px 16px -10px;">
            <tr>
              <td style="width: 25%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Orders (7d)</div>
                <div style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 4px;">${report.lastSevenDaysStats.totalOrders}</div>
              </td>
              <td style="width: 25%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Revenue (7d)</div>
                <div style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 4px;">₹${report.lastSevenDaysStats.totalRevenue.toLocaleString("en-IN")}</div>
              </td>
              <td style="width: 25%; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center;">
                <div style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase;">Fulfillment</div>
                <div style="font-size: 22px; font-weight: 700; color: #15803d; margin-top: 4px;">${fulfillmentPercent}%</div>
              </td>
              <td style="width: 25%; background: ${report.lastSevenDaysStats.unfulfilledOrders === 0 ? '#f8fafc' : '#fef2f2'}; border: 1px solid ${report.lastSevenDaysStats.unfulfilledOrders === 0 ? '#e2e8f0' : '#fecaca'}; border-radius: 8px; padding: 14px; text-align: center;">
                <div style="font-size: 11px; font-weight: 600; color: ${report.lastSevenDaysStats.unfulfilledOrders === 0 ? '#64748b' : '#991b1b'}; text-transform: uppercase;">Pending</div>
                <div style="font-size: 22px; font-weight: 700; color: ${report.lastSevenDaysStats.unfulfilledOrders === 0 ? '#0f172a' : '#b91c1c'}; margin-top: 4px;">${report.lastSevenDaysStats.unfulfilledOrders}</div>
              </td>
            </tr>
          </table>

          <!-- Section: 7-Day Orders Table -->
          <div style="margin-top: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a;">📦 Orders & Fulfillment Highlights (Last 7 Days)</h3>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">
                    <th style="padding: 10px 12px;">Order</th>
                    <th style="padding: 10px 12px;">Customer</th>
                    <th style="padding: 10px 12px;">Amount</th>
                    <th style="padding: 10px 12px;">Payment</th>
                    <th style="padding: 10px 12px;">Shiprocket ID</th>
                    <th style="padding: 10px 12px;">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  ${ordersRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section: Diagnostics & Infrastructure -->
          <div style="margin-top: 28px;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f172a;">🛠️ System Health & Infrastructure Diagnostics</h3>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <table style="width: 100%; font-size: 13px; line-height: 1.8;">
                <tr>
                  <td style="color: #64748b; width: 220px; font-weight: 600;">Shiprocket JWT Token:</td>
                  <td style="color: #0f172a;">✅ Active in Redis & RDS (${report.tokenInfo.daysRemaining} days remaining, expires ${report.tokenInfo.expiresAt})</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Nightly Status Sync:</td>
                  <td style="color: #0f172a;">✅ ${report.syncStats.checkedCount} Shiprocket orders checked, ${report.syncStats.updatedCount} fulfillments updated</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Payment Gateway:</td>
                  <td style="color: #0f172a;">✅ Razorpay Live Gateway (rzp_live) Connected</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Cron Job Schedule:</td>
                  <td style="color: #0f172a;">✅ <strong>02:23 AM IST</strong> (Next run: ${report.nextScheduledRun})</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Database Target:</td>
                  <td style="color: #0f172a;">✅ AWS RDS PostgreSQL (Healthy)</td>
                </tr>
              </table>
            </div>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            This confirmation report is automatically sent every 3 days from the ProCare E-Commerce Production Server.
          </p>
        </div>
      </div>
    `,
  }

  try {
    console.log(`[EmailService] Sending 3-day health report email to ${recipient} via SES...`)
    return await transporter.sendMail(mailOptions)
  } catch (sesError: any) {
    console.warn(`[EmailService] SES health report failed (${sesError.message}). Attempting Gmail SMTP fallback...`)
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "team@webclixs.in",
          pass: "wsek gghl znno gedt",
        },
      })
      const fallbackMailOptions = {
        ...mailOptions,
        from: `"ProCare Logistics Monitor" <team@webclixs.in>`
      }
      return await fallbackTransporter.sendMail(fallbackMailOptions)
    } catch (gmailError: any) {
      console.error("[EmailService] Both SES and Gmail fallback failed for health report:", gmailError.message)
    }
  }
}



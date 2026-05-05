const nodemailer = require("nodemailer");
require("dotenv").config();

async function main() {
  console.log("Starting Email Test...");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"ProCare Test" <${process.env.SMTP_FROM}>`,
      to: "webdev4436@gmail.com",
      subject: "SMTP Configuration Test - ProCare Store",
      text: "If you are reading this, your SMTP configuration is working correctly!",
      html: "<b>If you are reading this, your SMTP configuration is working correctly!</b>",
    });

    console.log("Message sent: %s", info.messageId);
    console.log("SUCCESS! Check your inbox at webdev4436@gmail.com");
  } catch (error) {
    console.error("FAILED to send email:", error);
  }
}

main();

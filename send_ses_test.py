import smtplib
from email.message import EmailMessage


# SMTP credentials
# IAM user name

# ses-smtp-user.20260704-184958
# SMTP user name

# AKIAQR3V6JQOEXHYDV4W
# SMTP password

# BKPS/Wh8CFvBYWDGnshbFLXl5M7zMcilf6wsXYhSHTPn



SMTP_HOST = "email-smtp.us-east-1.amazonaws.com"
SMTP_PORT = 587
SMTP_USERNAME = "AKIAQR3V6JQOEXHYDV4W"
SMTP_PASSWORD = "BKPS/Wh8CFvBYWDGnshbFLXl5M7zMcilf6wsXYhSHTPn"
FROM_EMAIL = "orders@propremiumcare.com"
TO_EMAIL = "niteshspp189@gmail.com"
SUBJECT = "Amazon SES test from propremiumcare.com"
BODY = "Hello, this is a test email sent through Amazon SES SMTP --."

msg = EmailMessage()
msg["From"] = FROM_EMAIL
msg["To"] = TO_EMAIL
msg["Subject"] = SUBJECT
msg.set_content(BODY)

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
    print("Email sent successfully")
except Exception as e:
    print(f"Failed to send email: {e}")

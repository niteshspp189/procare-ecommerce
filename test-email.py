from pathlib import Path
code = '''import smtplib
from email.message import EmailMessage

SMTP_HOST = "email-smtp.us-east-1.amazonaws.com"
SMTP_PORT = 587
SMTP_USERNAME = "PUT_YOUR_SES_SMTP_USERNAME_HERE"
SMTP_PASSWORD = "PUT_YOUR_SES_SMTP_PASSWORD_HERE"
FROM_EMAIL = "orders@propremiumcare.com"
TO_EMAIL = "niteshspp189@gmail.com"
SUBJECT = "Amazon SES test from propremiumcare.com"
BODY = "Hello, this is a test email sent through Amazon SES SMTP."

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
'''
Path('output').mkdir(exist_ok=True)
Path('output/send_ses_test.py').write_text(code)
print('created output/send_ses_test.py')
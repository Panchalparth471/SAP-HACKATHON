import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_reset_email(email, reset_url):
    sender_email = "xzxzx9377@gmail.com"
    sender_password = "whja atqc uhqd wltx"  # Ensure this is an app password, not your actual password
    subject = "Password Reset Request"
    body = f"""
    Hello,

    We received a request to reset your password. Click the link below to reset your password:
    {reset_url}

    If you didn't request this, please ignore this email.
    """
    print(f"Reset URL: {reset_url}")  # Debugging output
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        print("Connecting to SMTP server...")  # Debug
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.set_debuglevel(1)  # Enable debugging output
            server.starttls()
            print("Logging in to email...")
            server.login(sender_email, sender_password)
            print("Sending email...")
            server.sendmail(sender_email, email, msg.as_string())
            print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")

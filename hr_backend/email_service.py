# email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

def send_otp_email(email: str, otp_code: str, username: str) -> bool:
    """Send OTP via email with beautiful HTML template"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="520px" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(37,99,235,0.08);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
                            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">M2T HR Portal</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Secure Sign-In Verification</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 28px;">
                            <h2 style="margin:0 0 6px;color:#1e293b;font-size:18px;">Hello {username},</h2>
                            <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Use this code to complete your sign-in:</p>
                            <div style="background:linear-gradient(135deg,#f0f4ff,#eff6ff);border:1.5px solid #c7d2fe;border-radius:10px;padding:20px;text-align:center;">
                                <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">Your Verification Code</p>
                                <div style="font-size:32px;font-weight:900;color:#2563eb;letter-spacing:8px;font-family:'Courier New',monospace;margin:8px 0;">{otp_code}</div>
                                <p style="margin:12px 0 0;background:rgba(37,99,235,0.08);color:#1e40af;font-size:12px;font-weight:600;padding:6px 14px;border-radius:6px;display:inline-block;">⏱ Expires in 5 minutes</p>
                            </div>
                            <div style="background:#f8fafc;border-left:3px solid #6366f1;padding:14px 16px;border-radius:6px;margin-top:24px;">
                                <p style="margin:0;color:#475569;font-size:13px;"><strong>🔒 Security Tip:</strong> If you didn't request this code, please ignore this email.</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:24px 28px;border-top:1px solid #e2e8f0;text-align:center;border-radius:0 0 12px 12px;">
                            <p style="margin:0;color:#64748b;font-size:12px;">© 2025 M2T HR Portal. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    # Fallback to console if SMTP not configured
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASS]):
        print(f"\n{'='*50}")
        print(f"📧 OTP EMAIL (Console Fallback)")
        print(f"{'='*50}")
        print(f"To: {email}")
        print(f"User: {username}")
        print(f"\n🔐 OTP CODE: {otp_code}\n")
        print(f"⏱ Expires: 5 minutes")
        print(f"{'='*50}\n")
        return True
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your OTP: {otp_code}"
        msg["From"] = f"M2T HR Portal <{settings.SMTP_FROM}>"
        msg["To"] = email
        
        msg.attach(MIMEText(html_body, "html"))
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_FROM, [email], msg.as_string())
        server.quit()
        
        print(f"✅ OTP sent to {email}: {otp_code}")
        return True
        
    except Exception as e:
        print(f"⚠️ Email failed: {e}")
        print(f"\n📧 OTP (Fallback): {otp_code}\n")
        return True

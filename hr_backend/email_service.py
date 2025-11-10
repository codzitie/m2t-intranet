# email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
from datetime import date


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


def send_timesheet_lock_notification(
    employee_email: str,
    employee_name: str,
    lock_date: date,
    manager_email: str = None,
    manager_name: str = None
) -> bool:
    """
    Send timesheet lock notification to employee with CC to manager
    
    Args:
        employee_email: Employee's email
        employee_name: Employee's name
        lock_date: Date that was locked
        manager_email: Manager's email (optional, for CC)
        manager_name: Manager's name (optional)
    """
    
    formatted_date = lock_date.strftime('%A, %B %d, %Y')
    short_date = lock_date.strftime('%B %d, %Y')
    
    html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table width="560px" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(37,99,235,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
                            <div style="font-size:42px;margin-bottom:8px;">⏰</div>
                            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Timesheet Auto-Locked</h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">M2T HR Portal Notification</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 28px;">
                            <h2 style="margin:0 0 6px;color:#1e293b;font-size:18px;">Hello {employee_name},</h2>
                            <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Your timesheet has been automatically locked as per company policy.</p>
                            
                            <!-- Lock Info Card -->
                            <div style="background:linear-gradient(135deg,#fff5f5,#fef2f2);border:1.5px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:24px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="vertical-align:top;padding-right:12px;font-size:32px;">🔒</td>
                                        <td style="vertical-align:top;">
                                            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;">Locked Date</p>
                                            <p style="margin:0;font-size:20px;font-weight:900;color:#dc2626;">{formatted_date}</p>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin:16px 0 0;color:#991b1b;font-size:13px;font-weight:600;">
                                    ⚠️ This timesheet is now locked and cannot be edited without approval.
                                </p>
                            </div>
                            
                            <!-- What This Means -->
                            <div style="background:#f8fafc;border-left:3px solid #3b82f6;padding:16px;border-radius:6px;margin-bottom:20px;">
                                <p style="margin:0 0 12px;color:#1e293b;font-size:14px;font-weight:700;">📌 What This Means:</p>
                                <table style="margin:0;color:#475569;font-size:13px;line-height:1.8;">
                                    <tr>
                                        <td style="vertical-align:top;padding:2px 8px 2px 0;">•</td>
                                        <td style="padding:2px 0;">Your timesheet for <strong>{short_date}</strong> has been locked</td>
                                    </tr>
                                    <tr>
                                        <td style="vertical-align:top;padding:2px 8px 2px 0;">•</td>
                                        <td style="padding:2px 0;">No further edits can be made to this day's entries</td>
                                    </tr>
                                    <tr>
                                        <td style="vertical-align:top;padding:2px 8px 2px 0;">•</td>
                                        <td style="padding:2px 0;">If you need to make changes, request an unlock from HR</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Action Required -->
                            <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:16px;text-align:center;">
                                <p style="margin:0 0 12px;color:#1e40af;font-size:14px;font-weight:700;">Need to make changes?</p>
                                <p style="margin:0;color:#3b82f6;font-size:13px;">
                                    Submit an unlock request through the HR Portal:<br/>
                                    <strong>Timesheet → Request Unlock</strong>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8fafc;padding:24px 28px;border-top:1px solid #e2e8f0;text-align:center;border-radius:0 0 12px 12px;">
                            <p style="margin:0 0 8px;color:#64748b;font-size:12px;">This is an automated notification from M2T HR Portal</p>
                            <p style="margin:0;color:#94a3b8;font-size:11px;">© 2025 M2T HR Portal. All rights reserved.</p>
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
        print(f"\n{'='*60}")
        print(f"📧 TIMESHEET LOCK NOTIFICATION (Console Fallback)")
        print(f"{'='*60}")
        print(f"To: {employee_email}")
        if manager_email:
            print(f"CC: {manager_email} ({manager_name})")
        print(f"Employee: {employee_name}")
        print(f"Lock Date: {formatted_date}")
        print(f"\n🔒 Timesheet for {lock_date.strftime('%Y-%m-%d')} has been locked")
        print(f"{'='*60}\n")
        return True
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⏰ Timesheet Locked for {short_date}"
        msg["From"] = f"M2T HR Portal <{settings.SMTP_FROM}>"
        msg["To"] = employee_email
        
        # Add CC if manager email provided
        if manager_email:
            msg["Cc"] = manager_email
        
        msg.attach(MIMEText(html_body, "html"))
        
        # Build recipient list (To + CC)
        recipients = [employee_email]
        if manager_email:
            recipients.append(manager_email)
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_FROM, recipients, msg.as_string())
        server.quit()
        
        print(f"✅ Timesheet lock notification sent to {employee_email}")
        if manager_email:
            print(f"   CC: {manager_email} ({manager_name})")
        return True
        
    except Exception as e:
        print(f"⚠️ Email failed: {e}")
        print(f"\n📧 Timesheet Lock (Fallback): {employee_name} - {lock_date}\n")
        return True

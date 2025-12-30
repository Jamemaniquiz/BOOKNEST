#!/usr/bin/env python3
"""
BookNest Email Verification Server
Sends real verification codes via Gmail SMTP
"""

import http.server
import socketserver
import json
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.parse import parse_qs, urlparse

# Configuration - UPDATE THESE WITH YOUR GMAIL CREDENTIALS
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "your-booknest-email@gmail.com"  # Your Gmail address
SENDER_PASSWORD = "your-app-password"  # Gmail App Password (not regular password!)

class BookNestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for sending verification emails"""
        if self.path == '/api/send-verification':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                email = data.get('email')
                code = data.get('code')
                
                if not email or not code:
                    self.send_json_response(400, {
                        'success': False,
                        'message': 'Email and code are required'
                    })
                    return
                
                # Send the email
                success = send_verification_email(email, code)
                
                if success:
                    self.send_json_response(200, {
                        'success': True,
                        'message': 'Verification code sent successfully'
                    })
                else:
                    self.send_json_response(500, {
                        'success': False,
                        'message': 'Failed to send email'
                    })
            
            except Exception as e:
                print(f"Error: {str(e)}")
                self.send_json_response(500, {
                    'success': False,
                    'message': f'Server error: {str(e)}'
                })
        else:
            self.send_response(404)
            self.end_headers()
    
    def send_json_response(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

def send_verification_email(to_email, code):
    """
    Send verification code email via Gmail SMTP
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'BookNest - Email Verification Code'
        msg['From'] = f'BookNest <{SENDER_EMAIL}>'
        msg['To'] = to_email
        
        # Plain text version
        text = f"""
Hello!

Your BookNest verification code is: {code}

This code will be valid for 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
BookNest Team
        """
        
        # HTML version
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            color: white;
        }}
        .logo {{
            font-size: 2.5rem;
            margin-bottom: 20px;
        }}
        h1 {{
            margin: 0 0 20px 0;
            font-size: 1.8rem;
        }}
        .code-box {{
            background: white;
            color: #667eea;
            font-size: 2.5rem;
            font-weight: bold;
            letter-spacing: 0.5rem;
            padding: 25px;
            margin: 30px 0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .message {{
            font-size: 1rem;
            margin: 20px 0;
            line-height: 1.8;
        }}
        .footer {{
            margin-top: 30px;
            font-size: 0.85rem;
            opacity: 0.9;
        }}
        .warning {{
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            font-size: 0.9rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📚</div>
        <h1>BookNest Email Verification</h1>
        <p class="message">
            Thank you for signing up! Please use the verification code below to complete your registration.
        </p>
        <div class="code-box">
            {code}
        </div>
        <p class="message">
            This code will expire in <strong>10 minutes</strong>.
        </p>
        <div class="warning">
            ⚠️ If you didn't request this code, please ignore this email.
        </div>
        <div class="footer">
            <p>Best regards,<br>BookNest Team</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Attach both versions
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Verification email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False

def main():
    PORT = 8000
    
    print("=" * 60)
    print("🚀 BookNest Email Verification Server")
    print("=" * 60)
    print(f"\n📧 Email Configuration:")
    print(f"   Sender: {SENDER_EMAIL}")
    print(f"   SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
    print(f"\n🌐 Server running at:")
    print(f"   http://localhost:{PORT}")
    print(f"\n📝 API Endpoint:")
    print(f"   POST http://localhost:{PORT}/api/send-verification")
    print(f"\n⚠️  IMPORTANT:")
    print(f"   1. Update SENDER_EMAIL in server.py")
    print(f"   2. Update SENDER_PASSWORD with Gmail App Password")
    print(f"   3. See EMAIL_SETUP.md for instructions")
    print("\n" + "=" * 60)
    print("\nPress Ctrl+C to stop the server\n")
    
    with socketserver.TCPServer(("", PORT), BookNestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")

if __name__ == "__main__":
    main()

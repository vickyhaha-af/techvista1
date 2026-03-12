import os
import smtplib
from email.message import EmailMessage
from config import EMAIL_PROVIDER, SENDGRID_API_KEY, FROM_EMAIL

class EmailService:
    def __init__(self):
        self.provider = EMAIL_PROVIDER.lower()
        self.from_email = FROM_EMAIL
        
        # If we had real Sendgrid
        if self.provider == "sendgrid" and SENDGRID_API_KEY:
            try:
                import sendgrid
                from sendgrid.helpers.mail import Mail, Email, To, Content
                self.sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
            except ImportError:
                print("Warning: sendgrid library not installed, fallback to mock")
                self.provider = "mock"
    
    def send_email(self, to_email: str, subject: str, html_body: str) -> dict:
        """
        Sends an email or mocks it depending on the environment.
        """
        if self.provider == "mock":
            return self._mock_send(to_email, subject, html_body)
        elif self.provider == "sendgrid":
            return self._sendgrid_send(to_email, subject, html_body)
        else:
            print(f"Provider {self.provider} not supported gracefully yet. Mocking instead.")
            return self._mock_send(to_email, subject, html_body)

    def _mock_send(self, to_email: str, subject: str, html_body: str) -> dict:
        """Simulates sending an email"""
        print("\n" + "="*50)
        print("📨 MOCK EMAIL SEND TRIGGERED")
        print("="*50)
        print(f"To:      {to_email}")
        print(f"From:    {self.from_email}")
        print(f"Subject: {subject}")
        print("-" * 50)
        print(html_body)
        print("="*50 + "\n")
        
        return {
            "success": True,
            "message_id": "mock-message-12345",
            "provider": "mock"
        }

    def _sendgrid_send(self, to_email: str, subject: str, html_body: str) -> dict:
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        message = Mail(
            from_email=self.from_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_body
        )
        try:
            response = self.sg.send(message)
            return {
                "success": str(response.status_code).startswith('2'),
                "message_id": response.headers.get('X-Message-Id', 'unknown'),
                "provider": "sendgrid"
            }
        except Exception as e:
            print(f"SendGrid Error: {e}")
            return {
                "success": False,
                "error": str(e),
                "provider": "sendgrid"
            }

# Singleton
email_service = EmailService()

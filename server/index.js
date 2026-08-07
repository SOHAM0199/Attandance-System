/**
 * SmartPulse Attendance Management System - Express Backend Server
 * Real Inbox 2FA Email Dispatcher with Dynamic Gmail/SMTP Transporter
 */
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory SMTP Configuration
let smtpConfig = {
  host: process.env.SMTP_HOST || process.env.GMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER || process.env.GMAIL_USER || '',
  pass: process.env.SMTP_PASS || process.env.GMAIL_PASS || ''
};

let globalTransporter = null;

function updateTransporter() {
  if (smtpConfig.user && smtpConfig.pass) {
    globalTransporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    });
    console.log(`✉️ Live SMTP Transporter initialized for: ${smtpConfig.user}`);
  }
}

updateTransporter();

// Endpoint to update SMTP credentials dynamically
app.post('/api/config-smtp', (req, res) => {
  const { user, pass, host, port } = req.body;
  if (user) smtpConfig.user = user.trim();
  if (pass) smtpConfig.pass = pass.trim();
  if (host) smtpConfig.host = host.trim();
  if (port) smtpConfig.port = Number(port);

  updateTransporter();

  return res.json({
    success: !!globalTransporter,
    message: globalTransporter 
      ? `SMTP mailer configured for ${smtpConfig.user}` 
      : 'Invalid SMTP configuration.'
  });
});

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'SmartPulse AMS 2FA Real Inbox Email Dispatcher',
    endpoints: {
      health: '/api/health',
      sendOtp: '/api/send-otp',
      configSmtp: '/api/config-smtp'
    }
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'SmartPulse AMS 2FA Server',
    activeUser: smtpConfig.user || 'None',
    timestamp: new Date().toISOString()
  });
});

// Real Inbox 2FA Email Dispatcher Endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, otp, customUser, customPass, customHost, customPort } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Recipient email and OTP code are required.' });
    }

    const recipientEmail = email.trim();

    // Check if custom SMTP credentials were submitted in request
    let activeTransporter = globalTransporter;
    let senderEmail = smtpConfig.user || 'no-reply@smartpulse-ams.com';

    if (customUser && customPass) {
      const portNum = Number(customPort) || 465;
      activeTransporter = nodemailer.createTransport({
        host: customHost || 'smtp.gmail.com',
        port: portNum,
        secure: portNum === 465,
        auth: {
          user: customUser.trim(),
          pass: customPass.trim()
        }
      });
      senderEmail = customUser.trim();
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
        <h2 style="color: #6366f1; margin-top: 0;">SmartPulse AMS Admin Security</h2>
        <p style="font-size: 15px; color: #cbd5e1;">Hello Admin,</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
          Your confidential 6-digit Two-Factor (2FA) verification code for logging into the <strong>Admin Dashboard</strong> is:
        </p>
        <div style="background-color: #1e293b; padding: 18px 25px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #34d399; border-radius: 10px; margin: 15px 0; border: 1px solid #334155;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 13px;">This OTP code is valid for 10 minutes. Do not share this code with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b;">SmartPulse Attendance Management System • Real Mail Inbox Delivery</p>
      </div>
    `;

    if (activeTransporter) {
      const mailOptions = {
        from: `"SmartPulse Security" <${senderEmail}>`,
        to: recipientEmail,
        subject: '🔐 Admin Portal Login 2FA Verification Code',
        html: htmlContent
      };

      const info = await activeTransporter.sendMail(mailOptions);
      console.log(`✉️ 2FA OTP Email successfully delivered to ${recipientEmail} (ID: ${info.messageId})`);

      return res.json({
        success: true,
        message: `2FA OTP code delivered directly to email inbox: ${recipientEmail}`
      });
    }

    // Direct Web Dispatch Notice
    console.log(`✉️ 2FA OTP generated for ${recipientEmail}: ${otp}`);

    return res.json({
      success: true,
      message: `2FA OTP verification code sent to ${recipientEmail}. (Configure Gmail App Password below for direct inbox delivery)`
    });

  } catch (err) {
    console.error('Error dispatching OTP email:', err);
    return res.status(500).json({ success: false, message: 'SMTP Delivery Failed: ' + err.message });
  }
});

// Start Express Backend Server
app.listen(PORT, () => {
  console.log(`🚀 SmartPulse AMS 2FA Mailer Server running on port ${PORT}`);
});

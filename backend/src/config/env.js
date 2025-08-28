import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/huddle',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5176',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  email: {
    from: process.env.EMAIL_FROM || 'Huddle <noreply@huddle.com>',
  },
  // SMS Configuration
  sms: {
    apiKey: process.env.SMS_API_KEY, // For 2factor.in
    msg91AuthKey: process.env.MSG91_AUTH_KEY, // For MSG91
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID, // For MSG91
  },
  // Twilio Configuration (optional)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
};

export const env = config;



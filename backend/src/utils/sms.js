import twilio from 'twilio';
import axios from 'axios';
import { config } from '../config/env.js';

// Initialize Twilio client (if credentials are available)
let twilioClient = null;
if (config.twilio?.accountSid && config.twilio?.authToken) {
  twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
}

// Free SMS service using 2factor.in (for Indian numbers)
const sendSMSVia2Factor = async (mobileNumber, otp) => {
  try {
    const apiKey = config.sms?.apiKey || '2factor_api_key'; // You'll need to get this from 2factor.in
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobileNumber}/${otp}/HUDDLE_OTP`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'success') {
      console.log('SMS sent via 2factor:', response.data);
      return true;
    } else {
      console.error('2factor SMS failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS via 2factor:', error);
    return false;
  }
};

// Free SMS service using MSG91 (for Indian numbers)
const sendSMSViaMSG91 = async (mobileNumber, otp) => {
  try {
    const authKey = config.sms?.msg91AuthKey || 'msg91_auth_key'; // You'll need to get this from MSG91
    const templateId = config.sms?.msg91TemplateId || 'template_id';
    
    const url = 'https://api.msg91.com/api/v5/flow/';
    const payload = {
      flow_id: templateId,
      sender: 'HUDDLE',
      mobiles: `91${mobileNumber}`,
      VAR1: otp
    };
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authkey': authKey
      }
    });
    
    if (response.data.type === 'success') {
      console.log('SMS sent via MSG91:', response.data);
      return true;
    } else {
      console.error('MSG91 SMS failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS via MSG91:', error);
    return false;
  }
};

// Twilio SMS service (paid but reliable)
const sendSMSViaTwilio = async (mobileNumber, otp) => {
  try {
    if (!twilioClient) {
      console.log('Twilio not configured, skipping...');
      return false;
    }

    const message = await twilioClient.messages.create({
      body: `Your Huddle OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
      from: config.twilio?.phoneNumber,
      to: `+91${mobileNumber}`
    });

    console.log('SMS sent via Twilio:', message.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    return false;
  }
};

// Main SMS sending function that tries multiple providers
export const sendSMSOTP = async (mobileNumber, otp, purpose = 'Event Join') => {
  console.log(`Attempting to send SMS OTP to ${mobileNumber}: ${otp}`);
  
  // Try Twilio first (if configured)
  if (twilioClient) {
    const twilioResult = await sendSMSViaTwilio(mobileNumber, otp);
    if (twilioResult) {
      return { success: true, provider: 'Twilio' };
    }
  }
  
  // Try MSG91 (free for Indian numbers)
  const msg91Result = await sendSMSViaMSG91(mobileNumber, otp);
  if (msg91Result) {
    return { success: true, provider: 'MSG91' };
  }
  
  // Try 2factor (free for Indian numbers)
  const factor2Result = await sendSMSVia2Factor(mobileNumber, otp);
  if (factor2Result) {
    return { success: true, provider: '2factor' };
  }
  
  // If all SMS providers fail, return false
  console.error('All SMS providers failed for mobile number:', mobileNumber);
  return { success: false, provider: 'none' };
};

// Test SMS sending
export const testSMSSending = async (mobileNumber) => {
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Testing SMS sending to ${mobileNumber} with OTP: ${testOTP}`);
  
  const result = await sendSMSOTP(mobileNumber, testOTP, 'Test');
  
  if (result.success) {
    console.log(`✅ SMS test successful via ${result.provider}`);
    return { success: true, otp: testOTP, provider: result.provider };
  } else {
    console.log('❌ SMS test failed');
    return { success: false, error: 'All SMS providers failed' };
  }
};

// Development fallback - simulate SMS sending
export const sendSMSOTPDev = async (mobileNumber, otp, purpose = 'Event Join') => {
  console.log(`🔧 DEVELOPMENT MODE: SMS OTP for ${mobileNumber}: ${otp} (${purpose})`);
  console.log(`📱 In production, this would be sent as SMS to +91${mobileNumber}`);
  
  // In development, we'll just log the OTP
  return { success: true, provider: 'Development', otp };
};

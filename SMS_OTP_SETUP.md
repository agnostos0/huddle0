# 📱 SMS OTP Setup Guide

## 🎯 Overview
The Huddle app now supports SMS OTP for event joining. Users will receive a 6-digit OTP via SMS when joining events individually or as a team.

## 🔧 SMS Service Options

### Option 1: Free Services (Recommended for India)

#### 2factor.in (Free for Indian numbers)
1. Go to [2factor.in](https://2factor.in/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to Railway environment variables:
   ```
   SMS_API_KEY=your_2factor_api_key
   ```

#### MSG91 (Free for Indian numbers)
1. Go to [MSG91](https://msg91.com/)
2. Sign up for a free account
3. Get your Auth Key and Template ID
4. Add to Railway environment variables:
   ```
   MSG91_AUTH_KEY=your_msg91_auth_key
   MSG91_TEMPLATE_ID=your_template_id
   ```

### Option 2: Twilio (Paid but reliable)
1. Go to [Twilio](https://twilio.com/)
2. Sign up and get your credentials
3. Add to Railway environment variables:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

## 🚀 Quick Setup (Development Mode)

For immediate testing, the app works in development mode without any SMS service:

1. **No configuration needed** - OTPs will be logged to console
2. **Test the flow** - Join events and check server logs for OTP
3. **Production setup** - Add SMS service credentials when ready

## 📋 Environment Variables

Add these to your Railway backend environment variables:

```env
# SMS Configuration (Choose one service)
SMS_API_KEY=your_2factor_api_key
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_template_id

# Twilio (Optional - paid service)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 🧪 Testing SMS OTP

### Test Endpoint
```
POST /api/otp/test-sms
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}
```

### Event Join Flow
1. Go to any event page
2. Click "Join Event"
3. Enter your mobile number
4. Click "Send OTP"
5. Check SMS or server logs for OTP
6. Enter OTP and join event

## 🔍 How It Works

1. **User enters mobile number** when joining event
2. **System generates 6-digit OTP**
3. **SMS sent via configured service** (or logged in dev mode)
4. **User enters OTP** to verify
5. **Event join completed** after verification

## 🛠️ Development Mode

In development (`NODE_ENV=development`):
- ✅ OTPs are logged to console
- ✅ No SMS service required
- ✅ Perfect for testing
- ✅ Shows OTP in response for easy testing

## 🚀 Production Mode

In production (`NODE_ENV=production`):
- ✅ Actual SMS sent to user's phone
- ✅ Multiple SMS providers for reliability
- ✅ Automatic fallback if one service fails
- ✅ Professional user experience

## 📱 SMS Message Format

```
Your Huddle OTP is: 123456. Valid for 10 minutes. Do not share this code with anyone.
```

## 🔒 Security Features

- ✅ 6-digit numeric OTP
- ✅ 10-minute expiration
- ✅ One-time use only
- ✅ Rate limiting (prevents spam)
- ✅ Secure verification process

## 🎯 Next Steps

1. **Test in development mode** (no setup required)
2. **Choose an SMS service** (2factor.in recommended for India)
3. **Add credentials** to Railway environment variables
4. **Test with real SMS** in production mode
5. **Monitor SMS delivery** and costs

## 💡 Tips

- **2factor.in** is free for Indian numbers and easy to set up
- **MSG91** also free for Indian numbers with good delivery rates
- **Twilio** is paid but very reliable for international use
- **Development mode** is perfect for testing without SMS costs
- **Monitor SMS costs** if using paid services

## 🆘 Troubleshooting

### OTP not received
1. Check server logs for errors
2. Verify SMS service credentials
3. Check mobile number format (10 digits)
4. Try resend OTP option

### SMS service errors
1. Verify API keys are correct
2. Check SMS service account status
3. Ensure sufficient SMS credits (if paid service)
4. Check mobile number format

### Development mode issues
1. Check console logs for OTP
2. Verify `NODE_ENV=development`
3. Check server is running
4. Verify API endpoint is accessible

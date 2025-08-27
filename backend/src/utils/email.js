import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

export const sendNoticeEmail = async (user, notice) => {
  const mailOptions = {
    from: config.smtpUser,
    to: user.email,
    subject: '🔔 Important Notice from Eventify Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #dc3545; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px;">
              ⚠️
            </div>
            <h1 style="color: #dc3545; margin: 0; font-size: 24px;">Important Notice</h1>
            <p style="color: #6c757d; margin: 10px 0 0 0;">From Eventify Administration</p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">Dear ${user.name},</h2>
            <p style="color: #856404; line-height: 1.6; margin: 0;">
              ${notice}
            </p>
          </div>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #721c24; margin: 0; font-size: 14px; font-weight: bold;">
              ⚠️ Your account has been deactivated due to this notice.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              If you have any questions or concerns, please contact our support team.
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 10px 0 0 0;">
              This is an automated message from Eventify. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notice email sent successfully to:', user.email);
  } catch (error) {
    console.error('Error sending notice email:', error);
    throw error;
  }
};

export const sendInviteEmail = async (invite, teamName, inviterName, reason = null) => {
  const inviteUrl = `${config.clientOrigin}/invite/${invite.token}`;
  
  const mailOptions = {
    from: config.email.from,
    to: invite.email,
    subject: `You're invited to join ${teamName} on Eventify!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Join the team and start collaborating on events</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi there!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            <strong>${inviterName}</strong> has invited you to join their team <strong>"${teamName}"</strong> on Eventify.
          </p>
          
          ${reason ? `
          <div style="background: #f0f8ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0;">Why they want you to join:</p>
            <p style="color: #374151; margin: 0; font-style: italic;">"${reason}"</p>
          </div>
          ` : ''}
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Eventify is a platform where teams can create, join, and manage events together. 
            As a team member, you'll be able to participate in events as a group and collaborate with your teammates.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #777; font-size: 14px; text-align: center;">
            This invitation will expire in 7 days.<br>
            If the button doesn't work, copy and paste this link: <br>
            <a href="${inviteUrl}" style="color: #667eea;">${inviteUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #777; font-size: 12px; text-align: center;">
            This email was sent from Eventify. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invite email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw error;
  }
};

export const sendTestEmail = async () => {
  const mailOptions = {
    from: config.email.from,
    to: config.smtp.user, // Send to yourself as a test
    subject: 'Eventify SMTP Test',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🎉 SMTP Configuration Successful!</h2>
        <p>Your Gmail SMTP is working correctly for Eventify.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

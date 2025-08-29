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
    subject: '🔔 Important Notice from Huddle Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #dc3545; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px;">
              ⚠️
            </div>
            <h1 style="color: #dc3545; margin: 0; font-size: 24px;">Important Notice</h1>
            <p style="color: #6c757d; margin: 10px 0 0 0;">From Huddle Administration</p>
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
              This is an automated message from Huddle. Please do not reply to this email.
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
    subject: `You're invited to join ${teamName} on Huddle!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 You're Invited!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Join the team and start collaborating on events</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi there!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            <strong>${inviterName}</strong> has invited you to join their team <strong>"${teamName}"</strong> on Huddle.
          </p>
          
          ${reason ? `
          <div style="background: #f0f8ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0;">Why they want you to join:</p>
            <p style="color: #374151; margin: 0; font-style: italic;">"${reason}"</p>
          </div>
          ` : ''}
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            Huddle is a platform where teams can create, join, and manage events together. 
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
            This email was sent from Huddle. If you didn't expect this invitation, you can safely ignore this email.
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

export const sendEventJoinNotification = async (event, participant, joinType, teamName = null) => {
  const eventUrl = `${config.clientOrigin}/event/${event._id}`;
  
  const mailOptions = {
    from: config.email.from,
    to: event.organizer.email,
    subject: `🎉 New participant joined your event: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 New Participant!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Someone just joined your event</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Great news!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            <strong>${participant.name}</strong> has joined your event <strong>"${event.title}"</strong>.
          </p>
          
          <div style="background: #f0f8ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1e40af; font-weight: 600; margin: 0 0 8px 0;">Join Details:</p>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li><strong>Join Type:</strong> ${joinType}</li>
              ${teamName ? `<li><strong>Team Name:</strong> ${teamName}</li>` : ''}
              <li><strong>Participant:</strong> ${participant.name}</li>
              <li><strong>Contact:</strong> ${participant.contactNumber || 'Not provided'}</li>
              <li><strong>Email:</strong> ${participant.email}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${eventUrl}" 
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      font-size: 16px;">
              View Event Details
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Current Participants:</strong> ${event.participants?.length || 0}${event.maxParticipants ? ` / ${event.maxParticipants}` : ''}
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #777; font-size: 12px; text-align: center;">
            This email was sent from Huddle. You can manage your event notifications in your dashboard.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Event join notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending event join notification:', error);
    throw error;
  }
};

export const sendTestEmail = async () => {
  const mailOptions = {
    from: config.email.from,
    to: config.smtp.user, // Send to yourself as a test
    subject: 'Huddle SMTP Test',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🎉 SMTP Configuration Successful!</h2>
        <p>Your Gmail SMTP is working correctly for Huddle.</p>
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

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.clientOrigin}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: config.email.from,
    to: user.email,
    subject: '🔐 Reset Your Huddle Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Reset your Huddle account password</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.name}!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            We received a request to reset your password for your Huddle account. If you didn't make this request, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #777; font-size: 12px; text-align: center;">
            This email was sent from Huddle. If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendUsernameRecoveryEmail = async (user) => {
  const mailOptions = {
    from: config.email.from,
    to: user.email,
    subject: '👤 Your Huddle Username',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">👤 Username Recovery</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Here's your Huddle username</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${user.name}!</h2>
          
          <p style="color: #555; line-height: 1.6; font-size: 16px;">
            You requested to recover your username for your Huddle account. Here are your account details:
          </p>
          
          <div style="background: #f0f8ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #1e40af; font-weight: 600; margin: 0 0 15px 0;">Account Information:</p>
            <ul style="color: #374151; margin: 0; padding-left: 20px;">
              <li><strong>Name:</strong> ${user.name}</li>
              <li><strong>Username:</strong> <span style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${user.username}</span></li>
              <li><strong>Email:</strong> ${user.email}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.clientOrigin}/login" 
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      font-size: 16px;">
              Login to Huddle
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Tip:</strong> Keep your username and password secure. Never share them with anyone.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #777; font-size: 12px; text-align: center;">
            This email was sent from Huddle. If you didn't request this, please contact support.
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Username recovery email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending username recovery email:', error);
    throw error;
  }
};

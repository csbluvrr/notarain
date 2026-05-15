const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

const emailService = {
  sendWarningEmail: async (to, name, daysInactive, daysRemaining) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #e67e22;">⚠️ Inactivity Warning</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your notary account has been inactive for <strong>${daysInactive} days</strong>.</p>
        <p>You have <strong style="color: #e67e22;">${daysRemaining} days</strong> remaining before deactivation.</p>
        <p><strong>To stay active:</strong> Call the <code>notaryPing()</code> function on your smart contract.</p>
        <p>Contract: ${process.env.CONTRACT_ADDRESS}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Notary Monitor" <${process.env.EMAIL_USER}>`,
        to,
        subject: "⚠️ Notary Inactivity Warning",
        html,
      });
      console.log(`📧 Warning email sent to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Email failed to ${to}:`, error.message);
      return false;
    }
  },

  sendDeactivationEmail: async (
    to,
    name,
    daysInactive,
    successorName,
    successorEmail,
  ) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #e74c3c;">🔴 Account Deactivated</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your notary account has been <strong>deactivated</strong> due to ${daysInactive} days of inactivity.</p>
        <p>Your responsibilities have been transferred to:</p>
        <ul>
          <li><strong>Successor:</strong> ${successorName}</li>
          <li><strong>Email:</strong> ${successorEmail}</li>
        </ul>
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Notary Monitor" <${process.env.EMAIL_USER}>`,
        to,
        subject: "🔴 Notary Account Deactivated",
        html,
      });
      console.log(`📧 Deactivation email sent to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Email failed to ${to}:`, error.message);
      return false;
    }
  },

  sendKeyTransferEmail: async (to, name, fromNotaryName) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #3498db;">🔑 Emergency Key Transfer</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>You have been assigned as the <strong>successor notary</strong> for ${fromNotaryName}.</p>
        <p>Please contact the system administrator to receive access to encrypted keys.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message.</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Notary Monitor" <${process.env.EMAIL_USER}>`,
        to,
        subject: "🔑 Emergency Key Transfer",
        html,
      });
      console.log(`📧 Key transfer notification sent to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Email failed to ${to}:`, error.message);
      return false;
    }
  },
};

module.exports = emailService;

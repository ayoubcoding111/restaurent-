const nodemailer = require('nodemailer');

function isMailConfigured() {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
    if (transporter) return transporter;
    if (!isMailConfigured()) return null;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return transporter;
}

async function sendPasswordResetEmail(toEmail, toName, resetUrl) {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@delicious-restaurant.com';
    const subject = 'Reset your Delicious Restaurant password';
    const text =
        `Hi ${toName || 'there'},\n\n` +
        `We received a request to reset your staff/admin password for Delicious Restaurant.\n\n` +
        `Click the link below to choose a new password (valid for 1 hour):\n${resetUrl}\n\n` +
        `If you did not request this, you can safely ignore this email.\n`;
    const html =
        `<p>Hi ${toName || 'there'},</p>` +
        `<p>We received a request to reset your staff/admin password for <strong>Delicious Restaurant</strong>.</p>` +
        `<p><a href="${resetUrl}">Click here to choose a new password</a> (valid for 1 hour).</p>` +
        `<p style="color:#666;font-size:12px">If you did not request this, you can safely ignore this email.</p>` +
        `<p style="color:#666;font-size:12px">Or paste this link in your browser:<br>${resetUrl}</p>`;

    const tx = getTransporter();
    if (!tx) {
        // Dev fallback — no SMTP configured. Log so the admin can still reset locally.
        if (process.env.NODE_ENV !== 'production') {
            console.log('📧 [DEV] SMTP not configured. Password reset link for', toEmail, ':', resetUrl);
        }
        return { sent: false, reason: 'smtp-not-configured' };
    }
    await tx.verify().catch((err) => {
        console.error('SMTP verify failed:', err.message);
        throw new Error('Email server unavailable');
    });
    await tx.sendMail({ from, to: toEmail, subject, text, html });
    console.log(`📧 Password reset email sent to ${toEmail}`);
    return { sent: true };
}

module.exports = { isMailConfigured, sendPasswordResetEmail };

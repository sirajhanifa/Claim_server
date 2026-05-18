const nodemailer = require('nodemailer');
const ClaimEntry = require('../models/claimEntries');
require('dotenv').config({ path: '../.env', quiet: true });

// -----------------------------------------------------------------------------------------------

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const escapeHtml = (str) => {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

const transporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    socketTimeout: 60000,
    connectionTimeout: 60000,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

transporter.verify((err, success) => {
    if (err) console.error("SMTP verification failed:", err.message);
    else console.log("SMTP server is ready to send emails");
});

// -----------------------------------------------------------------------------------------------

// Single claim email (HTML)

const buildSingleEmailHtml = (name, amount, claimType) => {

    const safeName = escapeHtml(name);
    const safeAmount = escapeHtml(amount.toString());
    const safeClaimType = escapeHtml(claimType);
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.5;">
            <h3 style="margin-bottom: 12px;">
                Confirmation of Successful Claim Credit
            </h3>
            <p style="margin: 0 0 10px 0;">
                Dear <strong>${safeName}</strong>,
            </p>
            <p style="margin: 0 0 12px 0;">
                Your claim of <strong>₹${safeAmount}</strong> for 
                <strong>${safeClaimType}</strong> has been credited.
            </p>
            <p style="margin: 12px 0 0 0;">
                Regards,<br/>
                Controller of Examinations<br/>
                Jamal Mohamed College
            </p>
        </div>
    `;
};
// -----------------------------------------------------------------------------------------------

// Combined email for multiple claims (HTML)

const buildCombinedEmailHtml = (name, claims, totalAmount) => {

    const safeName = escapeHtml(name);
    const safeTotal = escapeHtml(totalAmount.toString());
    let itemsHtml = '<ul>';
    for (const claim of claims) {
        itemsHtml += `<li>${escapeHtml(claim.claim_type_name)} - ₹${escapeHtml(claim.amount.toString())}</li>`;
    }
    itemsHtml += '</ul>';

   return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.5;">
            <h3 style="margin-bottom: 12px;">
                Confirmation of Successful Claims Credit
            </h3>
            <p style="margin: 0 0 10px 0;">
                Dear <strong>${safeName}</strong>,
            </p>
            <p style="margin: 0 0 10px 0;">
                We have credited a total of 
                <strong>₹${safeTotal}</strong> to your bank account,
                covering the following claims:
            </p>
            ${itemsHtml}
            <p style="margin: 12px 0 0 0;">
                Regards,<br/>
                Controller of Examinations<br/>
                Jamal Mohamed College
            </p>
        </div>
    `;
};

// -----------------------------------------------------------------------------------------------

// Send a single email (for one claim)

const sendSingleEmail = async (claim) => {
    if (!claim.email) return false;
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: claim.email,
        subject: `Confirmation of Successful Claim Credit - Total ₹${claim.amount}`,
        html: buildSingleEmailHtml(claim.staff_name, claim.amount, claim.claim_type_name),
        text: `Dear ${claim.staff_name},\n\nYour claim of Rs. ${claim.amount} for ${claim.claim_type_name} has been credited.\nRegards,\nController of Examinations\nJamal Mohamed College`
    };
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${claim.email} (attempt ${attempt})`);
            return true;
        } catch (err) {
            console.error(`Attempt ${attempt} failed for ${claim.email}:`, err.message);
            if (attempt === 3) {
                await ClaimEntry.findByIdAndUpdate(claim._id, { email_status: 'failed' });
                return false;
            }
            await delay(1000 * attempt);
        }
    }
    return false;
};

// -----------------------------------------------------------------------------------------------

/**
 * Group claims by email and send one combined email per person.
 * Updates email_status for all claims in a group only if the email succeeds.
 * Respects rate limits: after every 25 emails, delay 2 seconds.
 */

const sendGroupedEmails = async (claims) => {

    const pendingClaims = claims.filter(c => c.email && c.email_status === 'pending');
    if (pendingClaims.length === 0) return;

    // Group by email
    const groups = new Map();
    for (const claim of pendingClaims) {
        const email = claim.email;
        if (!groups.has(email)) {
            groups.set(email, []);
        }
        groups.get(email).push(claim);
    }

    console.log(`Sending ${groups.size} grouped emails for ${pendingClaims.length} claims`);
    let emailsSent = 0;

    for (const [email, claimGroup] of groups) {
        const totalAmount = claimGroup.reduce((sum, c) => sum + c.amount, 0);
        const name = claimGroup[0].staff_name; 
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: `Confirmation of Successful Claims Credit - Total ₹${totalAmount}`,
            html: buildCombinedEmailHtml(name, claimGroup, totalAmount),
            text: `Dear ${name},\n\nWe have credited a total of Rs. ${totalAmount} to your bank account for the following claims :\n${claimGroup.map(c => `- ${c.claim_type_name}: Rs. ${c.amount}`).join('\n')}\nRegards,\nController of Examinations\nJamal Mohamed College`
        };

        let success = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await transporter.sendMail(mailOptions);
                console.log(`Grouped email sent to ${email} (${claimGroup.length} claims, total ₹${totalAmount})`);
                success = true;
                break;
            } catch (err) {
                console.error(`Attempt ${attempt} failed for ${email}:`, err.message);
                if (attempt === 3) {
                    for (const claim of claimGroup) {
                        await ClaimEntry.findByIdAndUpdate(claim._id, { email_status: 'failed' });
                    }
                } else {
                    await delay(1000 * attempt);
                }
            }
        }

        if (success) {
            for (const claim of claimGroup) {
                await ClaimEntry.findByIdAndUpdate(claim._id, { email_status: 'sent' });
            }
            emailsSent++;
        }

        if (emailsSent % 25 === 0 && emailsSent > 0) {
            console.log(`Sent ${emailsSent} grouped emails, pausing 2 seconds...`);
            await delay(2000);
        }
    }
    console.log(`Grouped email sending completed. Success: ${emailsSent} groups.`);
};

// -----------------------------------------------------------------------------------------------

const sendBulkEmails = async (claims) => {
    console.warn("sendBulkEmails is deprecated. Use sendGroupedEmails instead.");
};

module.exports = { sendSingleEmail, sendGroupedEmails, sendBulkEmails };
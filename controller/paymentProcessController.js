const ClaimEntry = require('../models/claimEntries');
const { sendSingleEmail, sendGroupedEmails } = require('../services/emailService');

// -----------------------------------------------------------------------------------------------

// GET /pr-ids – get unique payment report ids with counts and total amounts

const getPrIds = async (req, res) => {

    try {

        const result = await ClaimEntry.aggregate([
            {
                $match: {
                    payment_report_id: { $exists: true, $ne: null },
                    status: "Submitted",
                    $or: [{ credited_date: null }, { credited_date: { $exists: false } }]
                }
            },
            {
                $group: {
                    _id: {
                        payment_report_id: "$payment_report_id",
                        staff_name: "$staff_name",
                        phone_number: "$phone_number",
                        claim_type_name: "$claim_type_name"
                    },
                    groupAmount: { $sum: { $toDouble: "$amount" } }
                }
            },
            {
                $group: {
                    _id: "$_id.payment_report_id",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$groupAmount" }
                }
            },
            {
                $project: { payment_report_id: "$_id", count: 1, totalAmount: 1, _id: 0 }
            }
        ]);
        res.json(result);
    } catch (err) {
        console.error("Failed to fetch PR IDs:", err);
        res.status(500).json({ error: "Failed to fetch PR IDs" });
    }
};

// -----------------------------------------------------------------------------------------------

// GET /claims/:prId – get all claims under a given payment report id

const getClaimsByPrId = async (req, res) => {
    try {
        const list = await ClaimEntry.find({
            payment_report_id: req.params.prId,
            status: "Submitted"
        });
        res.json(list);
    } catch (err) {
        console.error("Failed to fetch claims:", err);
        res.status(500).json({ error: "Failed to fetch claims" });
    }
};

// -----------------------------------------------------------------------------------------------

// PUT /update/:id – update single claim as credited

const updateClaim = async (req, res) => {

    try {
        
        const { credited_date, remarks } = req.body;
        const updated = await ClaimEntry.findByIdAndUpdate(
            req.params.id,
            {
                credited_date,
                remarks,
                status: credited_date ? "Credited" : "Submitted",
                email_status: credited_date ? 'pending' : 'pending' 
            },
            { new: true }
        );

        res.json(updated);

        if (updated.status === "Credited" && updated.email && updated.email_status === 'pending') {
            (async () => {
                const success = await sendSingleEmail(updated);
                if (success) {
                    await ClaimEntry.findByIdAndUpdate(updated._id, { email_status: 'sent' });
                }
            })();
        }
    } catch (err) {
        console.error('Error updating claim:', err);
        res.status(500).json({ error: "Failed to update claim" });
    }
};

// -----------------------------------------------------------------------------------------------

// PUT /update-multiple – bulk update claims (by ids or by payment_report_id)

const updateMultipleClaims = async (req, res) => {
    try {
        const { claimIds, payment_report_id, credited_date, remarks } = req.body;
        let targets = [];

        if (Array.isArray(claimIds) && claimIds.length > 0) {
            targets = await ClaimEntry.find({ _id: { $in: claimIds } });
        } else if (payment_report_id) {
            targets = await ClaimEntry.find({
                payment_report_id,
                status: "Submitted",
                $or: [{ credited_date: null }, { credited_date: { $exists: false } }]
            });
        } else {
            return res.status(400).json({ error: "No claimIds or payment_report_id provided" });
        }

        const updatedDocs = [];
        for (const doc of targets) {
            if (doc.status === "Credited" && doc.credited_date) continue;
            const updated = await ClaimEntry.findByIdAndUpdate(
                doc._id,
                {
                    credited_date: credited_date || new Date(),
                    remarks: remarks || (doc.remarks || "") + " (Bulk credited)",
                    status: "Credited",
                    email_status: 'pending'
                },
                { new: true }
            );
            updatedDocs.push(updated);
        }

        // Send response immediately
        res.json(updatedDocs);

        // Send grouped emails in background (one per person)
        if (updatedDocs.length > 0) {
            (async () => {
                await sendGroupedEmails(updatedDocs);
            })();
        }
    } catch (err) {
        console.error('Error updating claims:', err);
        res.status(500).json({ error: "Failed to update claims" });
    }
};

// -----------------------------------------------------------------------------------------------

module.exports = {
    getPrIds,
    getClaimsByPrId,
    updateClaim,
    updateMultipleClaims
};
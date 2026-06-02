const ClaimEntry = require('../models/claimEntries');
const User = require('../models/user');

// -----------------------------------------------------------------------------------------------------------------

// Handles payment report batches and claim status updates for finance team   

const getBatches = async (req, res) => {

    try {

        const batches = await ClaimEntry.aggregate([
            {
                $match: {
                    status: { $in: ["Processed", "Submitted", "Credited"] },
                    payment_report_id: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$payment_report_id",
                    claims: { $push: "$$ROOT" },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    payment_report_id: "$_id",
                    count: 1,
                    batchStatus: {
                        $cond: [
                            { $in: ["Processed", "$claims.status"] },
                            "Processed",
                            {
                                $cond: [
                                    { $in: ["Submitted", "$claims.status"] },
                                    "Submitted",
                                    "Credited"
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { payment_report_id: -1 } }
        ]);
        res.json(batches);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch batches" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Returns ALL claims for a given batch 

const getClaimsByBatch = async (req, res) => {
    try {
        const allClaims = await ClaimEntry.aggregate([
            { $match: { payment_report_id: req.params.prId } },
            { $sort: { staff_name: 1 } }
        ]);
        const processedCount = allClaims.filter(c => c.status === "Processed").length;
        res.json({ processedCount, claims: allClaims });
    } catch (err) {
        console.error('Error fetching claims by batch : ', err);
        res.status(500).json({ error: "Failed to fetch claims" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Updates status of ALL claims in a batch from "Processed" → "Submitted" (for payment processing)

const updateClaimsByBatch = async (req, res) => {
    try {
        const result = await ClaimEntry.updateMany(
            { payment_report_id: req.params.prId, status: "Processed" },
            { $set: { status: "Submitted", submitted_date: new Date() } }
        );
        if (result.modifiedCount === 0)
            return res.status(404).json({ message: "No 'Processed' claims found" });
        res.json({ message: `Updated ${result.modifiedCount} claims to 'Submitted'`, modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ error: "Failed to update status" });
    }
}

// -----------------------------------------------------------------------------------------------------------------

module.exports = { getBatches, getClaimsByBatch, updateClaimsByBatch };
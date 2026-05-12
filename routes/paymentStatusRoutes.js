// routes/adminPaymentStatus.js

const express = require("express");
const router = express.Router();
const ClaimEntry = require("../models/claimEntries");

// ------------------------------------------------------------------
// GET /pr-ids  →  returns all payment_report_id with at least one claim in "Processed" status
// ------------------------------------------------------------------
router.get("/pr-ids", async (req, res) => {
  try {
    const reports = await ClaimEntry.aggregate([
      {
        $match: {
          status: "Processed",               // only batches waiting to be submitted
          payment_report_id: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            staff_name: "$staff_name",
            phone_number: "$phone_number",
            claim_type_name: "$claim_type_name",
            payment_report_id: "$payment_report_id"
          }
        }
      },
      {
        $group: {
          _id: "$_id.payment_report_id",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          payment_report_id: "$_id",
          count: 1
        }
      },
      { $sort: { payment_report_id: -1 } }
    ]);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch report ids" });
  }
});

// ------------------------------------------------------------------
// GET /claims/:prId  →  returns grouped claims for a given prId with status "Processed"
// ------------------------------------------------------------------
router.get("/claims/:prId", async (req, res) => {
  try {
    const groupedClaims = await ClaimEntry.aggregate([
      {
        $match: {
          payment_report_id: req.params.prId,
          status: "Processed"
        }
      },
      {
        $group: {
          _id: {
            staff_name: "$staff_name",
            phone_number: "$phone_number",
            claim_type_name: "$claim_type_name",
            payment_report_id: "$payment_report_id"
          },
          staff_name: { $first: "$staff_name" },
          phone_number: { $first: "$phone_number" },
          claim_type_name: { $first: "$claim_type_name" },
          payment_report_id: { $first: "$payment_report_id" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          submission_date: { $first: "$submission_date" },
          credited_date: { $first: "$credited_date" },
          status: { $first: "$status" }
        }
      },
      {
        $project: {
          _id: 0,
          staff_name: 1,
          phone_number: 1,
          claim_type_name: 1,
          payment_report_id: 1,
          totalAmount: 1,
          count: 1,
          submission_date: 1,
          credited_date: 1,
          status: 1
        }
      },
      { $sort: { staff_name: 1 } }
    ]);

    res.json({
      processedCount: groupedClaims.length,
      claims: groupedClaims
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// ------------------------------------------------------------------
// PUT /update-status/:prId  →  changes all "Processed" claims in that batch to "Submitted"
// ------------------------------------------------------------------
router.put("/update-status/:prId", async (req, res) => {
  try {
    const result = await ClaimEntry.updateMany(
      {
        payment_report_id: req.params.prId,
        status: "Processed"
      },
      {
        $set: {
          status: "Submitted",
          submitted_date: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "No 'Processed' claims found for this batch" });
    }

    res.json({
      message: `Updated ${result.modifiedCount} claims to 'Submitted'`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update claim status" });
  }
});

module.exports = router;
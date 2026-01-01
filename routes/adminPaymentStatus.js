const express = require("express");
const router = express.Router();
const claimEntry = require("../models/claimEntry");

/**
 * GET PR IDs (Admin – View All)
 */
router.get("/pr-ids", async (req, res) => {
  try {
    const result = await claimEntry.aggregate([
      {
        $match: {
          payment_report_id: { $exists: true, $ne: null },
          status: { $in: ["Submitted to Principal", "Credited"] }
        }
      },
      {
        $group: {
          _id: "$payment_report_id",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          payment_report_id: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PR IDs" });
  }
});


/**
 * GET Claims under PR ID (Admin – Read Only)
 */
router.get("/claims/:prId", async (req, res) => {
  try {
    const claims = await claimEntry.find({
      payment_report_id: req.params.prId,
      status: { $in: ["Submitted to Principal", "Credited"] }
    });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});


module.exports = router;

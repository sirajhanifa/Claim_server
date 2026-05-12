const express = require("express");
const router = express.Router();
const ClaimEntry = require("../models/claimEntries");

// -----------------------------------------------------------------------------------------------

router.get("/pr-ids", async (req, res) => {

	try {

		const reports = await ClaimEntry.aggregate([

			{
				$match: {
					status: { $in: ["Submitted to Principal", "Credited"] },
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

			{
				$sort: {
					payment_report_id: -1
				}
			}

		]);

		res.json(reports);

	} catch (err) {
		res.status(500).json({ error: "Failed to fetch report ids" });
	}
});

// -----------------------------------------------------------------------------------------------

router.get("/claims/:prId", async (req, res) => {

	try {

		const groupedClaims = await ClaimEntry.aggregate([

			{
				$match: {
					payment_report_id: req.params.prId,
					status: { $in: ["Submitted to Principal", "Credited"] }
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

			{
				$sort: {
					staff_name: 1
				}
			}

		]);

		res.json({
			processedCount: groupedClaims.length,
			claims: groupedClaims
		});

	} catch (err) {
		res.status(500).json({ error: "Failed to fetch claims" });
	}
});

// -----------------------------------------------------------------------------------------------

module.exports = router;
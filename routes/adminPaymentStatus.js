const express = require("express");
const router = express.Router();
const claimEntry = require("../models/claimEntry");

// -----------------------------------------------------------------------------------------------

router.get("/pr-ids", async (req, res) => {

	try {

		const result = await claimEntry.aggregate([
			// Join with academic collection
			{
				$lookup: {
					from: "academic",
					localField: "academic_sem_label",
					foreignField: "academic_sem_label",
					as: "academic_data"
				}
			},

			// Convert array to object
			{
				$unwind: "$academic_data"
			},

			// Filter current active semester + status
			{
				$match: {
					"academic_data.active_sem": true,
					payment_report_id: { $exists: true, $ne: null, $ne: "" },
					status: { $in: ["Submitted to Principal", "Credited"] }
				}
			},

			// Group by payment_report_id
			{
				$group: {
					_id: "$payment_report_id",
					count: { $sum: 1 }
				}
			},

			// Final response format
			{
				$project: {
					_id: 0,
					payment_report_id: "$_id",
					count: 1
				}
			},

			// Optional sorting
			{
				$sort: {
					payment_report_id: 1
				}
			}
		]);
		res.json(result);
	} catch (err) {
		console.error('Error fetching payment report IDs : ', err);
		res.status(500).json({ error: "Failed to fetch PR IDs" });
	}
});
 
// -----------------------------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------------------------

module.exports = router;
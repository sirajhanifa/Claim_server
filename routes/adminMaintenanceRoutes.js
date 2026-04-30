const express = require("express");
const router = express.Router();
const ClaimEntry = require("../models/claimEntry");

// -----------------------------------------------------------------------------------------------


router.delete("/delete-year/:year", async (req, res) => {

	try {

		const { year } = req.params;

		const regex = new RegExp(`^PR-${year}-`);

		const count = await ClaimEntry.countDocuments({
			payment_report_id: { $regex: regex }
		});

		if (count === 0) {
			return res.status(200).json({
				message: `No records found for year ${year}`
			});
		}

		await ClaimEntry.deleteMany({
			payment_report_id: { $regex: regex }
		});

		res.status(200).json({
			message: `Deleted ${count} claim records for year ${year}`,
			deletedCount: count
		});

	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
});

// -----------------------------------------------------------------------------------------------

module.exports = router;

const express = require('express');
const router = express.Router();
const ClaimEntry = require('../models/claimEntry')
const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table');
const { getClaim } = require('../controller/claimReportController');

// -----------------------------------------------------------------------------------------------

router.get('/getclaimEntry', getClaim)

// -----------------------------------------------------------------------------------------------

// DELETE CLAIM

router.delete("/delete/:id", async (req, res) => {

	try {

		const deleted = await ClaimEntry.findByIdAndDelete(req.params.id);

		if (!deleted) {
			return res.status(404).json({ message: "Claim not found" });
		}

		return res.json({ message: "Claim deleted successfully" });
	} catch (err) {
		return res.status(500).json({ message: "Server error" });
	}
});

// -----------------------------------------------------------------------------------------------

// routes/claimReportRoutes.js

router.put('/submitClaims', async (req, res) => {

	try {

		const { claimType, category } = req.body;
		const today = new Date();

		const baseFilter = { $or: [{ submission_date: null }, { submission_date: '' }] };
		if (claimType && claimType !== 'all') {
			baseFilter.claim_type_name = claimType;
		}

		if (category && category !== 'all') {
			baseFilter.internal_external = category;
		}

		const unsubmittedClaims = await ClaimEntry.find(baseFilter);
		if (unsubmittedClaims.length === 0) {
			return res.status(200).json({ message: 'No unsubmitted claims found.' });
		}

		const year = today.getFullYear();

		const totalSubmitted = await ClaimEntry.countDocuments({
			submission_date: { $ne: null },
			payment_report_id: { $regex: `^PR-${year}-` }
		});

		const prId = `PR-${today.getFullYear()}-${String(totalSubmitted + 1).padStart(3, '0')}`;

		await ClaimEntry.updateMany(
			{ _id: { $in: unsubmittedClaims.map(c => c._id) } },
			{
				$set: {
					submission_date: today,
					status: 'Submitted to Principal',
					payment_report_id: prId
				}
			}
		);

		return res.status(200).json({
			message: 'Claims submitted successfully',
			prId,
			submission_date: today
		});

	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
});

// -----------------------------------------------------------------------------------------------

module.exports = router;


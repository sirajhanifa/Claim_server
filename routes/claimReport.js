const express = require('express');
const router = express.Router();
const ClaimEntry = require('../models/claimEntry')
const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table');

const { getClaim } = require('../controller/claimReportController');

router.get('/getclaimEntry', getClaim)


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


// routes/claimReportRoutes.js
router.put('/submitClaims', async (req, res) => {
  try {
    const { claimType,category } = req.body;
    const today = new Date();

    const baseFilter = { $or: [{ submission_date: null }, { submission_date: '' }] };
    if (claimType && claimType !== 'all') {
      baseFilter.claim_type_name = claimType;
    }

    // Category filter (INTERNAL / EXTERNAL)
    if (category && category !== 'all') {
      baseFilter.internal_external = category;
    }

    const unsubmittedClaims = await ClaimEntry.find(baseFilter);
    if (unsubmittedClaims.length === 0) {
      return res.status(200).json({ message: 'No unsubmitted claims found.' });
    }

    const totalSubmitted = await ClaimEntry.countDocuments({ submission_date: { $ne: null } });
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
      submission_date: today   // ✅ add this
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



module.exports = router;



// router.put('/submitClaims', async (req, res) => {
//   try {
//     const { claimType } = req.body; // Get selected claim type
//     const today = new Date();
//     const formattedDate = today.toISOString().slice(0, 10);

//     // Build filter for unsubmitted claims, with optional claim type
//     const baseFilter = {
//       $or: [{ submission_date: null }, { submission_date: '' }]
//     };
//     if (claimType && claimType !== 'all') {
//       baseFilter.claim_type_name = claimType;
//     }

//     const unsubmittedClaims = await ClaimEntry.find(baseFilter);

//     if (unsubmittedClaims.length === 0) {
//       return res.status(200).json({ message: 'No unsubmitted claims found.', prId: '', submission_date: '' });
//     }

//     // Find the last generated PR ID in all claims, sorted descending
//     const lastClaim = await ClaimEntry.findOne({ payment_report_id: { $exists: true, $ne: '' } })
//       .sort({ payment_report_id: -1 })
//       .exec();

//     let nextNumber = 1; // default starting number

//     if (lastClaim) {
//       // Extract the numeric sequence from last payment_report_id, e.g. PR-2025-010 -> 10
//       const lastPrId = lastClaim.payment_report_id;
//       const match = lastPrId.match(/PR-\d{4}-(\d{3})/);
//       if (match && match[1]) {
//         nextNumber = parseInt(match[1], 10) + 1;
//       }
//     }

//     const prId = `PR-${today.getFullYear()}-${String(nextNumber).padStart(3, '0')}`;

//     // Update only matched unsubmitted claim entries
//     await ClaimEntry.updateMany(
//       { _id: { $in: unsubmittedClaims.map((c) => c._id) } },
//       {
//         $set: {
//           submission_date: today,
//           status: 'Submitted to Principal',
//           payment_report_id: prId
//         }
//       }
//     );

//     return res.status(200).json({ message: 'Claims submitted successfully', prId, submission_date: today.toISOString() });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

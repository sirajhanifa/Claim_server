// const express = require('express');
// const router = express.Router();
// const claimEntry = require('../models/claimEntry');

// // Get all PR IDs with claim counts
// router.get('/pr-ids', async (req, res) => {
//   try {
//     const grouped = await claimEntry.aggregate([
//       {
//         $match: {
//           payment_report_id: { $exists: true, $ne: null },
//           $or: [
//             { credited_date: { $exists: false } },
//             { credited_date: null }
//           ]
//         }
//       },
//       {
//         $group: {
//           _id: '$payment_report_id',
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $project: {
//           payment_report_id: '$_id',
//           count: 1,
//           _id: 0
//         }
//       }
//     ]);

//     res.json(grouped);
//   } catch (err) {
//     console.error('Error fetching filtered PR IDs:', err);
//     res.status(500).json({ error: 'Failed to fetch PR IDs' });
//   }
// });


// // Get claims by PR ID
// router.get('/claims/:prId', async (req, res) => {
//   try {
//     const claims = await claimEntry.find({ payment_report_id: req.params.prId });
//     res.json(claims);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch claims' });
//   }
// });

// // Update credited date and remarks
// router.put('/update/:id', async (req, res) => {
//   try {
//     const { credited_date, remarks } = req.body;
//     const updated = await claimEntry.findByIdAndUpdate(
//       req.params.id,
//       {
//         credited_date,
//         remarks,
//         status: credited_date ? 'Credited' : 'Pending'
//       },
//       { new: true }
//     );
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to update claim' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const claimEntry = require('../models/claimEntry');
const nodemailer = require('nodemailer');

// Email Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sirajhanifa786@gmail.com",
    pass: "exmp qlur pbvr uysn"
  }
});

const sendCreditedEmail = async (email, name, amount) => {
  const mailOptions = {
    from: "sirajhanifa786@gmail.com",
    to: email,
    subject: "💰 Claim Credited Notification",
    text:'Test Notification for Claim Management System'
    // text: `Dear ${name},\n\nYour claim of ₹${amount} has been credited via NEFT.\n\nRegards,\nFinance Team`
  };

  await transporter.sendMail(mailOptions);
};

// Get PR IDs
router.get('/pr-ids', async (req, res) => {
  try {
    const result = await claimEntry.aggregate([
      {
        $match: {
          payment_report_id: { $exists: true, $ne: null },
          status: "Submitted to Principal",
          $or: [{ credited_date: null }, { credited_date: { $exists: false } }]
        }
      },
      {
        $group: {
          _id: "$payment_report_id",
          count: { $sum: 1 }
        }
      },
      {
        $project: { payment_report_id: "$_id", count: 1, _id: 0 }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch PR IDs" });
  }
});

// Get claims under PR ID
router.get('/claims/:prId', async (req, res) => {
  try {
    const list = await claimEntry.find({
      payment_report_id: req.params.prId,
      status: "Submitted to Principal"
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// Update claim as credited
router.put('/update/:id', async (req, res) => {
  try {
    const { credited_date, remarks } = req.body;

    const updated = await claimEntry.findByIdAndUpdate(
      req.params.id,
      {
        credited_date,
        remarks,
        status: credited_date ? "Credited" : "Submitted to Principal"
      },
      { new: true }
    );

    if (updated.status === "Credited" && updated.email) {
      await sendCreditedEmail(updated.email, updated.staff_name, updated.amount);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update claim" });
  }
});

module.exports = router;

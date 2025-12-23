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
    to: "abdulrasak4567@gmail.com",
    subject: "💰 Claim Credited Notification",
    // text:'Test Notification for Claim Management System'
    text: `Dear ${name},\n\nYour claim of ₹${amount} has been credited via NEFT.\n\nRegards,\nFinance Team\n\n(This is an automated message. Please do not reply.)`
  };

  await transporter.sendMail(mailOptions);
};

// Get PR IDs
router.get('/pr-ids', async (req, res) => {
  // console.log("hanifa")
  try {
    const result = await claimEntry.aggregate([
      {
        $match: {
          payment_report_id: {$exists: true, $ne: null},
          status: "Submitted to Principal",
          $or: [{credited_date: null}, {credited_date: {$exists: false}}]
        }
      },
      {
        $group: {
          _id: "$payment_report_id",
          count: {$sum: 1}
        }
      },
      {
        $project: {payment_report_id: "$_id", count: 1, _id: 0}
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({error: "Failed to fetch PR IDs"});
  }
});

// Get claims under PR ID
router.get('/claims/:prId', async (req, res) => {
  // console.log("siraj")
  try {
    const list = await claimEntry.find({
      payment_report_id: req.params.prId,
      status: "Submitted to Principal"
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({error: "Failed to fetch claims"});
  }
});

// Update claim as credited
router.put('/update/:id', async (req, res) => {
  try {
    const {credited_date, remarks} = req.body;

    const updated = await claimEntry.findByIdAndUpdate(
      req.params.id,
      {
        credited_date,
        remarks,
        status: credited_date ? "Credited" : "Submitted to Principal"
      },
      {new: true}
    );

    if (updated.status === "Credited" && updated.email) {
      await sendCreditedEmail(updated.email, updated.staff_name, updated.amount);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({error: "Failed to update claim"});
  }
});

// Bulk update claims (mark multiple claims as credited)
// Accepts { claimIds: [], payment_report_id, credited_date, remarks }
router.put('/update-multiple', async (req, res) => {
  try {
    const {claimIds, payment_report_id, credited_date, remarks} = req.body;
    let targets = [];

    if (Array.isArray(claimIds) && claimIds.length > 0) {
      targets = await claimEntry.find({_id: {$in: claimIds}});
    } else if (payment_report_id) {
      targets = await claimEntry.find({
        payment_report_id,
        status: "Submitted to Principal",
        $or: [{credited_date: null}, {credited_date: {$exists: false}}]
      });
    } else {
      return res.status(400).json({error: "No claimIds or payment_report_id provided"});
    }

    const updatedDocs = [];

    for (const doc of targets) {
      // skip already credited items
      if (doc.status === "Credited" && doc.credited_date) continue;

      const updated = await claimEntry.findByIdAndUpdate(
        doc._id,
        {
          credited_date: credited_date || new Date(),
          remarks: remarks || (doc.remarks || "") + " (Bulk credited)",
          status: "Credited"
        },
        {new: true}
      );

      updatedDocs.push(updated);

      if (updated && updated.status === "Credited" && updated.email) {
        try {
          await sendCreditedEmail(updated.email, updated.staff_name, updated.amount);
        } catch (emailErr) {
          console.error("Failed to send email for claim", updated._id, emailErr);
        }
      }
    }

    res.json(updatedDocs);
  } catch (err) {
    console.error("Bulk update failed:", err);
    res.status(500).json({error: "Failed to update claims"});
  }
});

module.exports = router;

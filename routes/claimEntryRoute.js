// routes/claims.js
const express = require('express');
const router = express.Router();
const Staff = require('../models/staffmanage');
const ClaimEntry = require('../models/claimEntry');
const ClaimType = require('../models/claimtype')

// GET staff details by phone
router.get('/getStaffByPhone/:phone', async (req, res) => {
  try {
    const staff = await Staff.findOne({ phone_no: req.params.phone });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    res.json({
      staff_id: staff.staff_id,
      staff_name: staff.staff_name,
      department: staff.department,
      designation: staff.designation,
      employment_type: staff.employment_type,
      email: staff.email,
      bank_name: staff.bank_name,
      branch_name: staff.branch_name,
      branch_code: staff.branch_code,
      ifsc_code: staff.ifsc_code,
      bank_acc_no: staff.bank_acc_no
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


router.post('/postClaim', async (req, res) => {
  try {
    // console.log("Incoming data:", req.body); // Add this line
    const claim = new ClaimEntry(req.body);
    await claim.save();
    res.status(201).json({ message: "Claim saved" });
  } catch (err) {
    console.error("Error saving claim:", err.message); // Add this too
    res.status(500).json({ error: err.message });
  }
});



router.post('/calculateAmount', async (req, res) => {
  try {
    const { claim_type_name } = req.body;

    if (!claim_type_name) {
      return res.status(400).json({ message: 'Claim type is required' });
    }

    const claim = await ClaimType.findOne({ claim_type_name });
    if (!claim) {
      return res.status(404).json({ message: 'Claim type not found' });
    }

    const settings = claim.amount_settings || {};
    let amount = 0;

    switch (claim_type_name) {
      // 🔷 QPS Claim
      case 'QPS': {
        const { no_of_qps_ug, no_of_qps_pg, no_of_scheme } = req.body;

        const ugCount = isNaN(no_of_qps_ug) ? 0 : parseInt(no_of_qps_ug);
        const pgCount = isNaN(no_of_qps_pg) ? 0 : parseInt(no_of_qps_pg);
        const schemeCount = isNaN(no_of_scheme) ? 0 : parseInt(no_of_scheme);

        const ugRate = settings.qps_ug_amount || 0;
        const pgRate = settings.qps_pg_amount || 0;
        const schemeRate = settings.qps_scheme_amount || 0;

        amount = ugRate * ugCount + pgRate * pgCount + schemeRate * schemeCount;

        if (amount === 0) {
          return res.status(400).json({ message: 'No valid QPS or Scheme count provided' });
        }

        return res.status(200).json({ amount });
      }


      // 🔷 CIA Reappear Claim
      case 'CIA REAPEAR CLAIM': {
        const { no_of_papers, role_type } = req.body;

        if (!no_of_papers || isNaN(no_of_papers) || !role_type) {
          return res.status(400).json({ message: 'Missing or invalid inputs for CIA Reappear' });
        }

        const staffRate = settings.cia_reval_staff_amount || settings.cia_reval_amount || 0;
        const tutorRate = settings.cia_reval_tutor_amount || settings.cia_reval_amount || 0;

        const rate = role_type === 'Staff' ? staffRate : tutorRate;
        const amount = rate * parseInt(no_of_papers);

        return res.status(200).json({ amount });
      }



      // 🔷 Scrutiny Claim
      case 'SCRUTINY CLAIM': {
        const { scrutiny_level, scrutiny_no_of_papers, scrutiny_days } = req.body;

        if (!scrutiny_level || isNaN(scrutiny_no_of_papers) || isNaN(scrutiny_days)) {
          return res.status(400).json({ message: 'Missing scrutiny level, papers, or days' });
        }

        const paperRate =
          scrutiny_level === 'UG'
            ? settings.scrutiny_ug_rate || 0
            : scrutiny_level === 'PG'
              ? settings.scrutiny_pg_rate || 0
              : 0;

        const dayRate = settings.scrutiny_day_rate || 0;

        amount =
          paperRate * parseInt(scrutiny_no_of_papers) +
          dayRate * parseInt(scrutiny_days);

        return res.status(200).json({ amount });
      }

      // 🔷 Central Valuation Claim
      case 'CENTRAL VALUATION': {
        const {
          total_scripts,
          days_halted,
          travel_allowance,
          tax_applicable
        } = req.body;

        if (
          isNaN(total_scripts) ||
          isNaN(days_halted) ||
          isNaN(travel_allowance)
        ) {
          return res.status(400).json({ message: 'Missing or invalid Central Valuation inputs' });
        }

        const scriptRate = settings.script_rate || 0;
        const haltRate = settings.halt_day_rate || 0;

        const totalScriptsAmount = scriptRate * parseInt(total_scripts);
        const haltAmount = haltRate * parseInt(days_halted);
        const travelAmount = parseFloat(travel_allowance);

        const total = totalScriptsAmount + haltAmount + travelAmount;
        const tax = tax_applicable?.toLowerCase() === 'aided' ? total * 0.1 : 0;

        amount = total - tax;

        return res.status(200).json({ amount });
      }

      // 🔷 Practical Exam Claim
      case 'PRACTICAL EXAM CLAIM': {
        const {
          no_of_qps,              // from form.qps_paper_setting
          total_no_student,       // from form.total_students
          degree_level,           // UG / PG
          no_of_days_halted,      // from form.days_halted
          tax_applicable          // from form.tax_type
        } = req.body;

        // console.log("✅ Practical Claim Body:", req.body);

        if (
          isNaN(no_of_qps) ||
          isNaN(total_no_student) ||
          isNaN(no_of_days_halted) ||
          !degree_level
        ) {
          return res.status(400).json({ message: 'Missing or invalid Practical Exam inputs' });
        }

        const qpsCount = parseInt(no_of_qps);
        const studentCount = parseInt(total_no_student);
        const haltDays = parseInt(no_of_days_halted);

        // ✅ QPS Rate Logic from backend settings
        let qpsRate = 0;
        if (qpsCount === 1) {
          qpsRate = settings.qps_single_rate || 0;   // e.g. 120 from DB
        } else if (qpsCount > 1) {
          qpsRate = qpsCount * (settings.qps_multiple_rate || 0); // e.g. 5 * 100
        }

        // ✅ Student Rate Logic
        const studentRate =
          degree_level === 'UG'
            ? settings.ug_student_rate || 0
            : degree_level === 'PG'
              ? settings.pg_student_rate || 0
              : 0;

        const haltRate = settings.halt_day_rate || 0;

        const studentAmount = studentRate * studentCount;
        const haltAmount = haltRate * haltDays;

        const total = qpsRate + studentAmount + haltAmount;

        // ✅ Tax logic (10% only if Aided)
        const tax = tax_applicable === 'Aided' ? total * 0.1 : 0;

        amount = total - tax;

        // console.log("✅ Calculated Practical Exam Amount:", amount);

        return res.status(200).json({ amount });
      }



      // 🔷 Ability Enhancement Claim
      case 'ABILITY ENHANCEMENT CLAIM': {
        const {
          ability_total_no_students,
          ability_no_of_days_halted,
          ability_tax_type
        } = req.body;

        if (
          isNaN(ability_total_no_students) ||
          isNaN(ability_no_of_days_halted)
        ) {
          return res.status(400).json({ message: 'Missing or invalid Ability Enhancement inputs' });
        }

        const studentCount = parseInt(ability_total_no_students);
        const haltDays = parseInt(ability_no_of_days_halted);

        const studentRate = settings.student_rate || 0;
        const haltRate = settings.halted_day_rate || 0;
        const taxPercent = settings.tax_percentage || 0;

        const baseAmount = (studentRate * studentCount) + (haltRate * haltDays);

        // ✅ Apply tax only if type is AIDED
        const tax =
          ability_tax_type?.toUpperCase() === 'AIDED' && taxPercent > 0
            ? baseAmount * (taxPercent / 100)
            : 0;

        amount = baseAmount + tax;

        return res.status(200).json({ amount });
      }



      // 🔷 Unsupported Claim
      default:
        return res.status(400).json({ message: 'Unsupported claim type' });
    }
  } catch (error) {
    console.error('❌ Error calculating amount:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;

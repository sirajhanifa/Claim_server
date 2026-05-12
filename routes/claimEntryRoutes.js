const express = require('express');
const router = express.Router();
const Staff = require('../models/staff');
const ClaimEntry = require('../models/claimEntries');
const ClaimType = require('../models/claimTypes');
const Academic = require('../models/academic')

// -----------------------------------------------------------------------------------------------

// Search phone numbers by partial match

router.get('/search-phone/:prefix', async (req, res) => {

	try {

		let prefix = req.params.prefix;

		if (!prefix) return res.json([]);

		const start = Number(prefix + "0".repeat(10 - prefix.length));
		const end = Number(prefix + "9".repeat(10 - prefix.length));

		const staff = await Staff.find(
			{
				phone_no: { $gte: start, $lte: end }
			},
			{ phone_no: 1, _id: 0 }
		)
			.limit(10)
			.sort({ phone_no: 1 });

		res.json(staff);

	} catch (error) {
		console.log('Error from search phone : ', error);
		res.status(500).json({ message: "Error fetching phone suggestions" });
	}
});

// -----------------------------------------------------------------------------------------------

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
			category: staff.category || '',
			college: staff.college || '',
			email: staff.email,
			bank_name: staff.bank_name,
			branch_name: staff.branch_name,
			branch_code: staff.branch_code,
			ifsc_code: staff.ifsc_code,
			bank_acc_no: staff.bank_acc_no
		});
	} catch (error) {
		console.error('Error fetching staff : ', error);
		res.status(500).json({ message: 'Server Error' });
	}
});

// -----------------------------------------------------------------------------------------------

// Claim save

router.post('/postClaim', async (req, res) => {
	try {
		const active_academic = await Academic.findOne({ active_sem: true });
		const { academic_sem_label } = active_academic;
		const claim = new ClaimEntry({ ...req.body, academic_sem_label });
		await claim.save();
		res.status(201).json({ message: "Claim saved" });
	} catch (err) {
		console.error("Error saving claim:", err.message);
		res.status(500).json({ error: err.message });
	}
});

// -----------------------------------------------------------------------------------------------

// Claim amount calculation

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

			// QPS
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

			// CIA Reappear Claim
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

			// Scrutiny Claim
			case 'SCRUTINY CLAIM': {
				const { no_of_ug_papers, no_of_pg_papers } = req.body;
				const ugPapers = parseInt(no_of_ug_papers) || 0;
				const pgPapers = parseInt(no_of_pg_papers) || 0;
				if (ugPapers === 0 && pgPapers === 0) {
					return res.status(400).json({ message: "Missing number of papers" });
				}
				const ugRate = Number(settings.scrutiny_ug_rate) || 0;
				const pgRate = Number(settings.scrutiny_pg_rate) || 0;
				const amount = ugPapers * ugRate + pgPapers * pgRate;
				return res.status(200).json({ amount });

			}

			// CENTRAL VALUATION
			case 'CENTRAL VALUATION': {
				const {
					central_total_scripts_ug,
					central_total_scripts_pg,
					central_travel_allowance,
					central_tax_applicable
				} = req.body;

				const ugScripts = Number(central_total_scripts_ug || 0);
				const pgScripts = Number(central_total_scripts_pg || 0);
				const travelAllowance = Number(central_travel_allowance || 0);

				if ([ugScripts, pgScripts, travelAllowance].some(isNaN)) {
					return res.status(400).json({ message: 'Invalid Central Valuation inputs' });
				}

				// Rates from settings
				const ugRate = settings.ug_script_rate || 0;
				const pgRate = settings.pg_script_rate || 0;

				// Base calculations (UG + PG + Travel)
				const ugAmount = ugScripts * ugRate;
				const pgAmount = pgScripts * pgRate;
				const baseAmount = ugAmount + pgAmount + travelAllowance;

				// Send tax % to frontend
				const taxPercent =
					central_tax_applicable?.toUpperCase() === 'AIDED'
						? settings.tax_rate || 0
						: 0;

				return res.status(200).json({
					baseAmount,
					taxPercent,
					breakdown: { ugAmount, pgAmount, travelAllowance }
				});
			}

			// Practical Exam Claim
			case 'PRACTICAL EXAM CLAIM': {
				const {
					no_of_qps,
					total_no_student,
					degree_level,
					no_of_days_halted,
					tax_applicable
				} = req.body;

				if (
					isNaN(no_of_qps) ||
					isNaN(total_no_student) ||
					isNaN(no_of_days_halted) ||
					!degree_level
				) {
					return res.status(400).json({
						message: 'Missing or invalid Practical Exam inputs'
					});
				}

				const qpsCount = parseInt(no_of_qps);
				const studentCount = parseInt(total_no_student);

				// QPS Rate Logic
				let qpsRate = 0;
				if (qpsCount === 1) {
					qpsRate = settings.qps_single_rate || 0;
				} else if (qpsCount > 1) {
					qpsRate = qpsCount * (settings.qps_multiple_rate || 0);
				}

				// Student Rate Logic
				const studentRate =
					degree_level === 'UG'
						? settings.ug_student_rate || 0
						: degree_level === 'PG'
							? settings.pg_student_rate || 0
							: 0;

				const studentAmount = studentRate * studentCount;

				// BASE AMOUNT (without DA)
				const baseAmount = qpsRate + studentAmount;

				// Tax % from backend settings
				const taxPercent =
					tax_applicable?.toUpperCase() === 'AIDED'
						? settings.tax_percentage || 0
						: 0;

				// Return both baseAmount and taxPercent to frontend
				return res.status(200).json({
					baseAmount,
					taxPercent
				});
			}

			// 🔷 Ability Enhancement Claim
			case 'ABILITY ENHANCEMENT CLAIM': {
				const {
					ability_total_no_students,
					ability_tax_type
				} = req.body;

				if (isNaN(ability_total_no_students)) {
					return res.status(400).json({
						message: 'Invalid Ability Enhancement inputs'
					});
				}
				const studentCount = parseInt(ability_total_no_students);
				const studentRate = settings.student_rate || 0;
				const baseAmount = studentRate * studentCount;
				const taxPercent =
					ability_tax_type?.toUpperCase() === 'AIDED'
						? settings.tax_percentage || 0
						: 0;

				return res.status(200).json({
					baseAmount,
					taxPercent
				});
			}
			default:
				return res.status(400).json({ message: 'Unsupported claim type' });
		}
	} catch (error) {
		console.error('Error calculating amount : ', error);
		res.status(500).json({ message: 'Server error' });
	}
});

// -----------------------------------------------------------------------------------------------

module.exports = router;
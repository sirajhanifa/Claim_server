const ClaimEntry = require('../models/claimEntries');
const Academic = require('../models/academic');

// -----------------------------------------------------------------------------------------------

// Fetch unsubmitted claims

const unSubmittedClaims = async (req, res) => {
    try {
        const currAcademic = await Academic.findOne({ active_sem: true });
        if (!currAcademic) {
            return res.status(404).json({ message: 'No active academic semester found' });
        }
        const entries = await ClaimEntry.find({
            academic_sem_label: currAcademic.academic_sem_label,
            status: 'Unsubmitted'
        }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching pending claim entries : ', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// -----------------------------------------------------------------------------------------------

// Delete claim by id

const claimDelete = async (req, res) => {
    try {
        const deleted = await ClaimEntry.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "Claim not found" });
        }
        return res.json({ message: "Claim deleted successfully" });
    } catch (err) {
        console.error('Error deleting claim : ', err);
        return res.status(500).json({ message: "Server error" });
    }
}

// -----------------------------------------------------------------------------------------------

// Update claim amount by id

const updateClaimAmount = async (req, res) => {

    try {

        const { id } = req.params;
        const { amount } = req.body;

        if (amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        const updatedClaim = await ClaimEntry.findByIdAndUpdate(
            id,
            { amount: Number(amount) },
            { new: true, runValidators: true }
        );

        if (!updatedClaim) {
            return res.status(404).json({ message: 'Claim not found' });
        }

        return res.json({ message: 'Claim amount updated successfully', claim: updatedClaim });
    } catch (err) {
        console.error('Error updating claim amount:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------

// Submit claims

const submitClaims = async (req, res) => {

    try {

        const { claimType, category, ifscFilter } = req.body;
        const today = new Date();

        // BASE FILTER

        const baseFilter = {
            status: 'Unsubmitted',
            submitted_date: { $in: [null, ''] }
        };

        // Claim Type Filter
        if (claimType && claimType !== 'all') {
            baseFilter.claim_type_name = claimType;
        }

        // Category Filter
        if (category && category !== 'all') {
            baseFilter.internal_external = category;
        }

        // IFSC Filter
        if (ifscFilter === "JMC_IOB") {
            baseFilter.ifsc_code = "IOBA0000467";
        }

        if (ifscFilter === "IOB_OTHERS") {
            baseFilter.ifsc_code = {
                $regex: "^IOBA",
                $ne: "IOBA0000467"
            };
        }

        if (ifscFilter === "OTHER_BANKS") {
            baseFilter.ifsc_code = {
                $not: /^IOBA/
            };
        }

        // GET CLAIMS

        const unsubmittedClaims = await ClaimEntry.find(baseFilter);

        if (unsubmittedClaims.length === 0) {
            return res.status(200).json({
                message: 'No unsubmitted claims found.'
            });
        }

        // GET ACTIVE SEMESTER

        const activeAcademic = await Academic.findOne({
            active_sem: true
        });

        if (!activeAcademic) {
            return res.status(400).json({
                message: 'No active academic semester found.'
            });
        }

        // Example: "Apr-26" => "A26"

        const semLabel = activeAcademic.academic_sem_label;

        const [month, yearPart] = semLabel.split('-');

        const shortSemLabel =
            month.charAt(0).toUpperCase() + yearPart;

        // CLAIM PREFIX

        const prefixMap = {
            "PRACTICAL EXAM CLAIM": "PRAC",
            "CENTRAL VALUATION": "CV",
            "COE CV CLAIM": "COE",
            "SKILLED ASSISTANT": "SKILLED",
            "ABILITY ENHANCEMENT CLAIM": "AEC",
            "QPS": "QPS",
            "OTHER": "OTHER",
            "ALL": "ALL",
            "SCRUTINY CLAIM": "SCRU",
            "CIA REAPEAR CLAIM": "CIA",
            "CAMP CLAIM": "CAMP"
        };

        const claimPrefix = prefixMap[claimType] || "OTHER";

        // CURRENT CLAIM COUNT
        // Example:
        // activeAcademic.claim_counters.SKILLED = 2

        const currentClaimCount =
            activeAcademic.claim_counters?.[claimPrefix] || 0;

        // NEXT CLAIM COUNT

        const nextClaimCount = currentClaimCount + 1;

        // TOTAL BATCH COUNT

        const currentTotalCount =
            activeAcademic.claim_counters?.TOTAL || 0;

        const nextTotalCount = currentTotalCount + 1;

        // FINAL PAYMENT REPORT ID
        // Example:
        // SKILLED-A26-03/15

        const prId =
            `${claimPrefix}-${shortSemLabel}-${String(nextClaimCount).padStart(2, '0')}/${String(nextTotalCount).padStart(2, '0')}`;

        // UPDATE CLAIMS

        await ClaimEntry.updateMany(
            {
                _id: { $in: unsubmittedClaims.map(c => c._id) }
            },
            {
                $set: {
                    processed_date: today,
                    status: 'Processed',
                    payment_report_id: prId
                }
            }
        );

        // UPDATE ACADEMIC COUNTERS

        await Academic.updateOne(
            { _id: activeAcademic._id },
            {
                $inc: {
                    [`claim_counters.${claimPrefix}`]: 1,
                    'claim_counters.TOTAL': 1,
                    total_claim_count: unsubmittedClaims.length,
                    total_claim_amount: unsubmittedClaims.reduce(
                        (sum, c) => sum + (Number(c.amount) || 0),
                        0
                    )
                }
            }
        );

        // RESPONSE

        return res.status(200).json({
            message: 'Claims submitted successfully',
            prId, processed_date: today
        });

    } catch (error) {
        console.error('Error in submitting claims : ', error);
        return res.status(500).json({ message: 'Internal Server Error' });

    }
};

// -----------------------------------------------------------------------------------------------

module.exports = { unSubmittedClaims, submitClaims, claimDelete, updateClaimAmount };
const ClaimEntry = require('../models/claimEntries');
const Staff = require('../models/staff');
const Academic = require('../models/academic');

// -----------------------------------------------------------------------------------------------------------------

// Helper to get active semester label

const getActiveSemesterLabel = async () => {
    const activeAcademic = await Academic.findOne({ active_sem: true });
    return activeAcademic ? activeAcademic.academic_sem_label : null;
};
 
// -----------------------------------------------------------------------------------------------------------------

const totalClaimsCount = async (req, res) => {

    try {

        const activeSemLabel = await getActiveSemesterLabel();
        const matchQuery = activeSemLabel ? { academic_sem_label: activeSemLabel } : {};
        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalClaims: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);
        const { totalClaims, totalAmount } = result[0] || { totalClaims: 0, totalAmount: 0 };
        res.status(200).json({ totalClaims, totalAmount });
    } catch (error) {
        console.error('Error fetching claim stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const staffsCount = async (req, res) => {

    try {
        const result = await Staff.aggregate([
            {
                $group: {
                    _id: "$employment_type",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert array to object
        let internal = 0;
        let external = 0;

        result.forEach((r) => {
            if (r._id === "Internal") internal = r.count;
            if (r._id === "External") external = r.count;
        });

        // console.log(internal, external)
        res.status(200).json({
            internal,
            external,
            total: internal + external
        });
    } catch (error) {
        console.error("Error fetching staff count:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Get credited claim count & credited amount

const getCreditedClaims = async (req, res) => {

    try {

        const activeSemLabel = await getActiveSemesterLabel();
        const matchQuery = { status: "Credited" };
        if (activeSemLabel) matchQuery.academic_sem_label = activeSemLabel;

        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    creditedClaims: { $sum: 1 },
                    creditedAmount: { $sum: "$amount" }
                }
            }
        ]);

        // If no credited claims exist
        const { creditedClaims, creditedAmount } =
            result[0] || { creditedClaims: 0, creditedAmount: 0 };

        res.status(200).json({ creditedClaims, creditedAmount });
    } catch (error) {
        console.error("Error fetching credited claims:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const getSubmittedClaims = async (req, res) => {

    try {

        const activeSemLabel = await getActiveSemesterLabel();
        const matchQuery = { status: { $in: ["Submitted", "Credited"] } };
        if (activeSemLabel) matchQuery.academic_sem_label = activeSemLabel;
        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    submittedClaims: { $sum: 1 },
                    submittedAmount: { $sum: "$amount" }
                }
            }
        ]);
        const { submittedClaims, submittedAmount } = result[0] || { submittedClaims: 0, submittedAmount: 0 };
        res.status(200).json({ submittedClaims, submittedAmount });
    } catch (error) {
        console.error("Error fetching submitted claims:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const getPendingClaims = async (req, res) => {

    try {

        const activeSemLabel = await getActiveSemesterLabel();
        const matchQuery = { status: { $in: ["Unsubmitted", "Processed"] } };
        if (activeSemLabel) matchQuery.academic_sem_label = activeSemLabel;
        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    pendingClaims: { $sum: 1 },
                    pendingAmount: { $sum: "$amount" }
                }
            }
        ]);
        const { pendingClaims, pendingAmount } = result[0] || { pendingClaims: 0, pendingAmount: 0 };
        res.status(200).json({ pendingClaims, pendingAmount });
    } catch (error) {
        console.error("Error fetching pending claims : ", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const getAwaitingClaims = async (req, res) => {

    try {

        const activeSemLabel = await getActiveSemesterLabel();

        const matchQuery = {
            status: { $in: ["Submitted"] }
        };

        if (activeSemLabel) {
            matchQuery.academic_sem_label = activeSemLabel;
        }

        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },

            {
                $group: {
                    _id: null,
                    awaitingClaims: { $sum: 1 },
                    awaitingAmount: { $sum: "$amount" },
                    uniquePaymentReports: {
                        $addToSet: "$payment_report_id"
                    }
                }
            },

            {
                $project: {
                    _id: 0,
                    awaitingClaims: 1,
                    awaitingAmount: 1,
                    uniqueReportCount: {
                        $size: "$uniquePaymentReports"
                    }
                }
            }
        ]);

        const data = result[0] || {
            awaitingClaims: 0,
            awaitingAmount: 0,
            uniqueReportCount: 0
        };

        res.status(200).json(data);

    } catch (error) {
        console.error("Error fetching awaiting claims : ", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const getInternalExternalClaims = async (req, res) => {
    
    try {

        const activeSemLabel = await getActiveSemesterLabel();

        const matchQuery = activeSemLabel
            ? { academic_sem_label: activeSemLabel }
            : {};

        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },

            {
                $group: {
                    _id: "$internal_external",
                    count: { $sum: 1 },
                    amount: { $sum: "$amount" }
                }
            }
        ]);

        let internal = {
            count: 0,
            amount: 0
        };

        let external = {
            count: 0,
            amount: 0
        };

        result.forEach(r => {

            if (r._id === "Internal") {
                internal.count = r.count;
                internal.amount = r.amount;
            }

            if (r._id === "External") {
                external.count = r.count;
                external.amount = r.amount;
            }

        });

        res.status(200).json({
            internal,
            external
        });

    } catch (error) {
        console.error("Error fetching internal/external claims : ", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const getClaimTypeAmounts = async (req, res) => {

    try {

        const activeSemLabel = await getActiveSemesterLabel();
        const matchQuery = activeSemLabel ? { academic_sem_label: activeSemLabel } : {};
        const result = await ClaimEntry.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$claim_type_name",
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);
        const data = result.map(r => ({
            name: r._id,
            amount: r.totalAmount
        }));
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching claim type amounts : ", error);
        res.status(500).json({ message: "Server error" });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Get academic trends for last 6 semesters

const getAcademicTrends = async (req, res) => {
    try {
        const academicRecords = await Academic.find()
            .sort({ createdAt: -1 }) 
            .limit(6)
            .select('academic_sem_label academic_year total_claim_amount total_claim_count');
        const trends = academicRecords.reverse().map(record => ({
            label: record.academic_sem_label,
            year: record.academic_year,
            amount: record.total_claim_amount || 0,
            count: record.total_claim_count || 0
        }));
        res.status(200).json(trends);
    } catch (error) {
        console.error('Error fetching academic trends : ', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

module.exports = { totalClaimsCount, staffsCount, getCreditedClaims, getSubmittedClaims, getPendingClaims, getAwaitingClaims, getInternalExternalClaims, getClaimTypeAmounts, getAcademicTrends };
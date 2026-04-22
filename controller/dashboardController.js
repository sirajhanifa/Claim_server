const Claim = require('../models/claimEntry');
const Staff = require('../models/staffmanage')

const getClaimCount = async (req, res) => {
    try {
        const result = await Claim.aggregate([
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

const getStaffCount = async (req, res) => {
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
            if (r._id === "INTERNAL") internal = r.count;
            if (r._id === "EXTERNAL") external = r.count;
        });

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

// Get credited claim count & credited amount
const getCreditedClaims = async (req, res) => {
    try {
        const result = await Claim.aggregate([
            {
                $match: { status: "Credited" }
            },
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

const getSubmittedClaims = async (req, res) => {
    try {
        const result = await Claim.aggregate([
            {
                $match: {
                    status: { $in: ["Submitted to Principal", "Credited"] }
                }
            },
            {
                $group: {
                    _id: null,
                    submittedClaims: { $sum: 1 },
                    submittedAmount: { $sum: "$amount" }
                }
            }
        ]);

        const { submittedClaims, submittedAmount } =
            result[0] || { submittedClaims: 0, submittedAmount: 0 };

        res.status(200).json({ submittedClaims, submittedAmount });
    } catch (error) {
        console.error("Error fetching submitted claims:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getPendingClaims = async (req, res) => {
    try {
        const result = await Claim.aggregate([
            {
                $match: { status: "Pending" }
            },
            {
                $group: {
                    _id: null,
                    pendingClaims: { $sum: 1 },
                    pendingAmount: { $sum: "$amount" }
                }
            }
        ]);
        const { pendingClaims, pendingAmount } =
            result[0] || { pendingClaims: 0, pendingAmount: 0 };

        res.status(200).json({ pendingClaims, pendingAmount });
    } catch (error) {
        console.error("Error fetching pending claims:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAwaitingClaims = async (req, res) => {
    try {
        const result = await Claim.aggregate([
            {
                $match: { status: "Submitted to Principal" }
            },
            {
                $group: {
                    _id: null,
                    awaitingClaims: { $sum: 1 },
                    awaitingAmount: { $sum: "$amount" }
                }
            }
        ]);

        const { awaitingClaims, awaitingAmount } =
            result[0] || { awaitingClaims: 0, awaitingAmount: 0 };
        res.status(200).json({ awaitingClaims, awaitingAmount });
    } catch (error) {
        console.error("Error fetching awaiting claims:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getInternalExternalClaims = async (req, res) => {
    try {
        const result = await Claim.aggregate([
            {
                $group: {
                    _id: "$internal_external",   // INTERNAL / EXTERNAL
                    count: { $sum: 1 },
                    amount: { $sum: "$amount" }
                }
            }
        ]);

        let internalCount = 0;
        let externalCount = 0;

        // Convert array → simple values
        result.forEach(r => {
            if (r._id === "INTERNAL") internalCount = r.count;
            if (r._id === "EXTERNAL") externalCount = r.count;
        });

        res.status(200).json({
            internal: internalCount,
            external: externalCount
        });

    } catch (error) {
        console.error("Error fetching internal/external claims:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getClaimTypeAmounts = async (req, res) => {
    try {
        const result = await Claim.aggregate([
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
        console.error("Error fetching claim type amounts:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getClaimCount, getStaffCount, getCreditedClaims, getSubmittedClaims, getPendingClaims, getAwaitingClaims, getInternalExternalClaims, getClaimTypeAmounts };

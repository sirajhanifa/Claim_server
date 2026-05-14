const ClaimEntry = require('../models/claimEntries');
const User = require('../models/user');

// -----------------------------------------------------------------------------------------------------------------

const deleteDataByAcademicSemLabel = async (req, res) => {

    try {

        const { academic_sem_label, admin_password } = req.body;

        if (!academic_sem_label || !admin_password) {
            return res.status(400).json({ message: "Academic semester label and admin password are required." });
        }

        // Verify admin password
        const adminUser = await User.findOne({ username: 'ADMIN' });

        if (!adminUser) {
            return res.status(404).json({ message: "Admin user not found in the system." });
        }

        if (adminUser.password !== admin_password) {
            return res.status(401).json({ message: "Invalid admin password." });
        }

        // Proceed to delete claims
        const result = await ClaimEntry.deleteMany({ academic_sem_label });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} claim entries for semester : ${academic_sem_label}`
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const exportDataByAcademicSemLabel = async (req, res) => {

    try {
        const { academic_sem_label } = req.body;
        if (!academic_sem_label) {
            return res.status(400).json({ message: "Academic semester label is required." });
        }

        const claims = await ClaimEntry.find({ academic_sem_label }).lean();
        res.status(200).json(claims);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------------------

module.exports = { deleteDataByAcademicSemLabel, exportDataByAcademicSemLabel };
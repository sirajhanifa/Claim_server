const ClaimEntry = require('../models/claimEntry');
const Academic = require('../models/academic');

const getClaim = async (req, res) => {
    try {
        const currAcademic = await Academic.findOne({ active_sem: true });
        const entries = await ClaimEntry.find({ academic_sem_label: currAcademic.academic_sem_label }).sort({ createdAt: -1 });
        res.json(entries);
    } catch (error) {
        console.error('Error fetching claim entries : ', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { getClaim };

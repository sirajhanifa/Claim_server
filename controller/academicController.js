const Academic = require('../models/academic');

// -----------------------------------------------------------------------------------------------------------------

const isValidSemLabel = (label) => {
    const regex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/;
    return regex.test(label);
};

const isValidAcademicYear = (year) => {
    const regex = /^\d{4}-\d{4}$/;
    if (!regex.test(year)) return false;
    const [start, end] = year.split('-').map(Number);
    return end === start + 1;
};

// -----------------------------------------------------------------------------------------------------------------

// Get all academics

const getAcademics = async (req, res) => {
    try {
        const academics = await Academic.find();
        res.status(200).json(academics);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Add new academic

const addAcademic = async (req, res) => {

    try {

        const { academic_sem_type, academic_sem_label, academic_year, active_sem } = req.body;

        if (!academic_sem_label || !isValidSemLabel(academic_sem_label)) {
            return res.status(400).json({ 
                message: "Semester label must follow the format 'Mon-YY' (e.g., Jun-26)" 
            });
        }
        if (!academic_year || !isValidAcademicYear(academic_year)) {
            return res.status(400).json({ 
                message: "Academic year must be 'YYYY-YYYY' where second year = first year + 1 (e.g., 2026-2027)" 
            });
        }

        if (active_sem) {
            await Academic.updateMany({}, { active_sem: false });
        }

        const newAcademic = new Academic({
            academic_sem_type,
            academic_sem_label,
            academic_year,
            active_sem: active_sem || false
        });

        await newAcademic.save();
        res.status(201).json({ message: "Academic record created successfully", academic: newAcademic });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Update academic

const updateAcademic = async (req, res) => {

    try {

        const { id } = req.params;
        const { academic_sem_label, academic_year, active_sem } = req.body;

        if (academic_sem_label && !isValidSemLabel(academic_sem_label)) {
            return res.status(400).json({ 
                message: "Semester label must follow the format 'Mon-YY' (e.g., Jun-26)" 
            });
        }
        if (academic_year && !isValidAcademicYear(academic_year)) {
            return res.status(400).json({ 
                message: "Academic year must be 'YYYY-YYYY' (e.g., 2026-2027)" 
            });
        }

        if (active_sem) {
            await Academic.updateMany({ _id: { $ne: id } }, { active_sem: false });
        }

        const updatedAcademic = await Academic.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedAcademic) {
            return res.status(404).json({ message: "Academic record not found" });
        }
        res.status(200).json({ message: "Academic record updated successfully", academic: updatedAcademic });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Delete academic

const deleteAcademic = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAcademic = await Academic.findByIdAndDelete(id);
        if (!deletedAcademic) {
            return res.status(404).json({ message: "Academic record not found" });
        }
        res.status(200).json({ message: "Academic record deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// -----------------------------------------------------------------------------------------------------------------

module.exports = {
    getAcademics,
    addAcademic,
    updateAcademic,
    deleteAcademic
};
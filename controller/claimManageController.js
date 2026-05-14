const ClaimType = require('../models/claimTypes');

// -----------------------------------------------------------------------------------------------------------------

const getClaims = async (req, res) => {
    try {
        const data = await ClaimType.find();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const addClaim = async (req, res) => {

    const { name, description } = req.body;

    try {
        const newClaim = await ClaimType.create({
            claim_type_name: name,
            description
        });

        res.status(201).json({ message: 'Claim added', data: newClaim });
    } catch (err) {
        res.status(500).json({ message: 'Error adding claim' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const updateClaim = async (req, res) => {

    const { name, description, amount_settings, isActive } = req.body;

    try {

        const updateData = {};
        if (name !== undefined) updateData.claim_type_name = name;
        if (description !== undefined) updateData.description = description;
        if (amount_settings !== undefined) updateData.amount_settings = amount_settings;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedClaim = await ClaimType.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedClaim) return res.status(404).json({ message: 'Claim not found' });
        res.json({ message: 'Claim updated successfully', data: updatedClaim });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

const deleteClaim = async (req, res) => {
    try {
        const deletedClaim = await ClaimType.findByIdAndDelete(req.params.id);
        if (!deletedClaim) return res.status(404).json({ message: 'Claim not found' });

        res.json({ message: 'Claim deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

module.exports = { getClaims, addClaim, updateClaim, deleteClaim };
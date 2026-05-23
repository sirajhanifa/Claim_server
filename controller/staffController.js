const Staff = require('../models/staff');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------------------------------------------

// Get all staff with optional filters

const getStaff = async (req, res) => {
    try {
        const filters = req.query;
        const staffList = await Staff.find(filters);
        res.status(200).json(staffList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Add single staff member

const addStaff = async (req, res) => {

    const {
        staff_id, staff_name, department, designation, category,
        phone_no, email, college, bank_acc_no, ifsc_code,
        employment_type, bank_name, bank_city_name
    } = req.body;

    try {

        const existing = await Staff.findOne({
            $or: [{ phone_no }, { bank_acc_no }]
        });
        if (existing) {
            return res.status(400).json({
                message: 'Duplicate entry: Phone number or Bank account already exists'
            });
        }

        const newStaff = await Staff.create({
            staff_id, staff_name, department, designation, category,
            phone_no, email, college, bank_acc_no, ifsc_code,
            employment_type, bank_name, bank_city_name
        });

        res.status(201).json({ message: 'Staff added successfully', data: newStaff });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding staff' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Update staff member

const updateStaff = async (req, res) => {

    const updates = req.body;

    try {
        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedStaff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        res.json({ message: 'Staff updated successfully', data: updatedStaff });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Delete staff member

const deleteStaff = async (req, res) => {
    try {
        const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
        if (!deletedStaff) {
            return res.status(404).json({ message: 'Staff not found' });
        }
        res.json({ message: 'Staff deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// Upload Excel file

const uploadStaff = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const record of data) {
            const existing = await Staff.findOne({
                $or: [
                    { phone_no: record.phone_no },
                    { bank_acc_no: record.bank_acc_no }
                ]
            });
            if (existing) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    message: `Duplicate found: Phone - ${record.phone_no}, Bank A/C - ${record.bank_acc_no}`
                });
            }
        }
        await Staff.insertMany(data);
        fs.unlink(req.file.path, () => {});
        res.status(200).json({ message: 'Staff data uploaded successfully', count: data.length });
    } catch (err) {
        console.error('Upload error:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Upload failed. Check Excel format.' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

module.exports = { getStaff, addStaff, updateStaff, deleteStaff, uploadStaff };
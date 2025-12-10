

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Staff = require('../models/staffmanage');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ensure uploads folder exists
const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Upload route
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

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
          error: `Duplicate found: Phone No - ${record.phone_no}, Bank A/C - ${record.bank_acc_no}`
        });
      }
    }

    await Staff.insertMany(data);
    fs.unlink(req.file.path, () => { });
    res.status(200).json({ message: '✅ Data uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed. Check Excel format.' });
  }
});

// Get all staff
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const staffList = await Staff.find(filters);
    res.status(200).json(staffList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff data' });
  }
});

// Add new staff
router.post('/', async (req, res) => {
  try {
    const { staff_id, staff_name, department, designation, category, phone_no, email,college, bank_acc_no, ifsc_code, employment_type, bank_name,
     } = req.body;

    // Check duplicates
    const existing = await Staff.findOne({ $or: [{ phone_no }, { bank_acc_no }] });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate phone number or bank account number' });
    }

    const newStaff = new Staff({
      staff_id,
      staff_name,
      department,
      designation,
      category,
      phone_no,
      email,
      college,
      bank_acc_no,
      ifsc_code,
      employment_type,
      bank_name,
    });

    await newStaff.save();
    res.status(201).json({ message: 'Staff added successfully' });
  } catch (err) {
    console.error('Add error:', err);
    res.status(500).json({ error: 'Failed to add staff' });
  }
});

router.post('/', async (req, res) => {
  try {
    const staff = new Staff(req.body);
    await staff.save();
    res.status(201).json({ message: 'Staff added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add staff' });
  }
});

// UPDATE staff by staff_id
router.put('/update/:id', async (req, res) => {
  try {
    const updated = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json({ message: "Staff updated successfully", updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update staff" });
  }
});
;

// DELETE staff by staff_id
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await Staff.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ error: 'Staff not found' });

    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});


module.exports = router;

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const {
    getStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    uploadStaff
} = require('../controller/staffController');

// -----------------------------------------------------------------------------------------------------------------

const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// -----------------------------------------------------------------------------------------------------------------

router.get('/', getStaff);
router.post('/', addStaff);
router.put('/update/:id', updateStaff);
router.delete('/delete/:id', deleteStaff);
router.post('/upload', upload.single('file'), uploadStaff);

// -----------------------------------------------------------------------------------------------------------------

module.exports = router;
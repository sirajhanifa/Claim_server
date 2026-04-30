const express = require('express');
const router = express.Router();
const { deleteDataByAcademicSemLabel } = require('../controller/dataDeletionController');

// -----------------------------------------------------------------------------------------------

router.post('/delete-by-academic-sem', deleteDataByAcademicSemLabel);

// -----------------------------------------------------------------------------------------------

module.exports = router;
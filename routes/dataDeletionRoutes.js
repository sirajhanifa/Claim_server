const express = require('express');
const router = express.Router();
const { deleteDataByAcademicSemLabel, exportDataByAcademicSemLabel } = require('../controller/dataDeletionController');

// -----------------------------------------------------------------------------------------------

router.post('/data-deletion/delete-by-academic-sem', deleteDataByAcademicSemLabel);
router.post('/data-deletion/export-by-academic-sem', exportDataByAcademicSemLabel);

// -----------------------------------------------------------------------------------------------

module.exports = router;
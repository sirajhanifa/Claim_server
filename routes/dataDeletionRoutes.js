const express = require('express');
const router = express.Router();
const { deleteDataByAcademicSemLabel } = require('../controller/dataDeletionController');

// -----------------------------------------------------------------------------------------------

router.post('/data-deletion/delete-by-academic-sem', deleteDataByAcademicSemLabel);

// -----------------------------------------------------------------------------------------------

module.exports = router;
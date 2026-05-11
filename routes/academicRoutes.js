const express = require('express');
const router = express.Router();
const {
    getAcademics,
    addAcademic,
    updateAcademic,
    deleteAcademic
} = require('../controller/academicController');

// -----------------------------------------------------------------------------------------------

router.get('/getAcademic', getAcademics);
router.post('/addAcademic', addAcademic);
router.put('/updateAcademic/:id', updateAcademic);
router.delete('/deleteAcademic/:id', deleteAcademic);

// -----------------------------------------------------------------------------------------------

module.exports = router;
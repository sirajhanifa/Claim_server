const express = require('express');
const { unSubmittedClaims, submitClaims, deleteClaim } = require('../controller/claimSubmissionController');
const router = express.Router();

// -----------------------------------------------------------------------------------------------

router.get('/unSubmittedClaims', unSubmittedClaims)
router.put('/submitClaims', submitClaims)
router.delete("/deleteClaim/:id", deleteClaim)

// -----------------------------------------------------------------------------------------------

module.exports = router;
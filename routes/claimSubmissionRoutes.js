const express = require('express');
const { unSubmittedClaims, submitClaims, claimDelete, updateClaimAmount } = require('../controller/claimSubmissionController');
const router = express.Router();

// -----------------------------------------------------------------------------------------------

router.get('/unSubmittedClaims', unSubmittedClaims)
router.put('/submitClaims', submitClaims)
router.delete("/claimDelete/:id", claimDelete)
router.put('/updateClaim/:id', updateClaimAmount);  

// -----------------------------------------------------------------------------------------------

module.exports = router;
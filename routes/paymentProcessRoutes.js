const express = require('express');
const router = express.Router();
const claimController = require('../controller/paymentProcessController');

// -----------------------------------------------------------------------------------------------

router.get('/pr-ids', claimController.getPrIds);
router.get('/claims/:prId', claimController.getClaimsByPrId);
router.put('/update/:id', claimController.updateClaim);
router.put('/update-multiple', claimController.updateMultipleClaims);

// -----------------------------------------------------------------------------------------------

module.exports = router;
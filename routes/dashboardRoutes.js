const express = require('express');
const router = express.Router();
const { totalClaimsCount, staffsCount, getCreditedClaims, getSubmittedClaims, getPendingClaims, getAwaitingClaims, getInternalExternalClaims, getClaimTypeAmounts } = require('../controller/dashboardController');

// -----------------------------------------------------------------------------------------------

router.get("/totalClaimsCount", totalClaimsCount)
router.get("/staffsCount", staffsCount);
router.get("/creditedclaims", getCreditedClaims);
router.get("/submittedclaims", getSubmittedClaims);
router.get("/pendingclaims", getPendingClaims);
router.get("/awaitingclaims", getAwaitingClaims);
router.get("/internalexternalclaims", getInternalExternalClaims);
router.get("/claimtypeamounts", getClaimTypeAmounts);

// -----------------------------------------------------------------------------------------------

module.exports = router;
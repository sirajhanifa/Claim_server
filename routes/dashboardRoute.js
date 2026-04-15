const express = require('express');
const router = express.Router();
const {getClaimCount, getStaffCount, getCreditedClaims, getSubmittedClaims, getPendingClaims, getAwaitingClaims, getInternalExternalClaims, getClaimTypeAmounts} = require('../controller/dashboardController');

router.get('/totalclaimscount', getClaimCount)
router.get("/staffcount", getStaffCount);
router.get("/creditedclaims", getCreditedClaims);
router.get("/submittedclaims", getSubmittedClaims);
router.get("/pendingclaims", getPendingClaims);
router.get("/awaitingclaims", getAwaitingClaims);
router.get("/internalexternalclaims", getInternalExternalClaims);
router.get("/claimtypeamounts", getClaimTypeAmounts);

module.exports = router;
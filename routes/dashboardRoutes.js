const express = require('express');
const router = express.Router();
const { 
    totalClaimsCount, staffsCount, getAcademicTrends, getCreditedClaims, getSubmittedClaims, getPendingClaims, 
    getAwaitingClaims, getInternalExternalClaims, getClaimTypeAmounts, getPaymentBadges, getPaymentTableData, 
    getPaymentTableDataByRole 
} = require('../controller/dashboardController');

// -----------------------------------------------------------------------------------------------

router.get("/totalClaimsCount", totalClaimsCount)
router.get("/staffsCount", staffsCount);
router.get("/creditedclaims", getCreditedClaims);
router.get("/submittedclaims", getSubmittedClaims);
router.get("/pendingclaims", getPendingClaims);
router.get("/awaitingclaims", getAwaitingClaims);
router.get("/internalexternalclaims", getInternalExternalClaims);
router.get("/claimtypeamounts", getClaimTypeAmounts);
router.get('/academic-trends', getAcademicTrends);
router.get('/payment-badges', getPaymentBadges);
router.get('/payment-table', getPaymentTableData);
router.get('/payment-table/user', getPaymentTableDataByRole);

// -----------------------------------------------------------------------------------------------

module.exports = router;
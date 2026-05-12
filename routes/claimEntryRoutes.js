const express = require('express');
const router = express.Router();
const { searchPhone, getStaffByPhone, postClaim, calculateAmount } = require('../controller/claimEntryController');

// -----------------------------------------------------------------------------------------------------------------

router.get('/search-phone/:prefix', searchPhone);
router.get('/getStaffByPhone/:phone', getStaffByPhone);
router.post('/postClaim', postClaim);
router.post('/calculateAmount', calculateAmount);

// -----------------------------------------------------------------------------------------------------------------

module.exports = router;
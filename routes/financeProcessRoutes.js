const express = require('express');
const router = express.Router();
const { getBatches, getClaimsByBatch, updateClaimsByBatch} = require('../controller/financeProcessController');

// -----------------------------------------------------------------------------------------------

router.get('/batches', getBatches);
router.get('/claims/batch/:prId', getClaimsByBatch);
router.put('/claims/batch/:prId', updateClaimsByBatch);

// -----------------------------------------------------------------------------------------------

module.exports = router;
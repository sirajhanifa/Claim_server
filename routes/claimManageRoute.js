const express = require('express');
const router = express.Router();
const {
  getClaims,
  addClaim,
  updateClaim,
  deleteClaim
} = require('../controller/claimManageController');

// -----------------------------------------------------------------------------------------------

router.get('/getClaim', getClaims);
router.post('/addclaim', addClaim);
router.post('/updateClaim/:id', updateClaim);
router.delete('/deleteClaim/:id', deleteClaim);

// -----------------------------------------------------------------------------------------------

module.exports = router;

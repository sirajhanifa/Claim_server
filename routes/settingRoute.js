const express = require('express')
const router = express.Router();
const { getUser, addUser, deleteUser, updateUser } = require('../controller/settingController')

router.get('/getUser', getUser)
router.post('/addUser', addUser)
router.delete('/deleteUser/:id', deleteUser)
router.put('/updateUser/:id', updateUser)

module.exports = router;
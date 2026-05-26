const express = require('express')
const router = express.Router();
const { getUser, addUser, deleteUser, updateUser, changePassword } = require('../controller/userController')

// -----------------------------------------------------------------------------------------------

router.get('/getUser', getUser)
router.post('/addUser', addUser)
router.delete('/deleteUser/:id', deleteUser)
router.put('/updateUser/:id', updateUser)
router.put('/changePassword', changePassword)

// -----------------------------------------------------------------------------------------------

module.exports = router;
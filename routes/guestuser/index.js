const express = require('express');
const router = express.Router();
const guestController = require('../../controllers/guestuser')

router.get('/appInfo', guestController.appInfo)

router.post('/', guestController.addGuestUser)

router.put('/:id', guestController.updateGuestUser);

router.get('/guestUserList', guestController.guestUserList)

module.exports = router
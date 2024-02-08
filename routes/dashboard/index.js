const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard')

router.get('/count-all', dashboardController.dashboard);

module.exports = router

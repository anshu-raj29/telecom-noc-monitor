const router = require('express').Router();
const alertController = require('../controllers/alertController');

router.get('/alerts', alertController.getAlerts);

module.exports = router;


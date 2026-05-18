const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/tower/:towerId', analyticsController.getTower);

module.exports = router;


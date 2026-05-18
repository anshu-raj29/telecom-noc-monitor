const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard', dashboardController.getDashboard);
router.get('/kpis', dashboardController.getKpis);
router.get('/network-health', dashboardController.getNetworkHealth);

module.exports = router;


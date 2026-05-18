const router = require('express').Router();
const aiController = require('../controllers/aiController');

router.get('/ml/overview', aiController.getMlOverview);

module.exports = router;

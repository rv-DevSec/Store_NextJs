const router = require('express').Router();
const { getCars } = require('../controllers/carController');

router.get('/', getCars);

module.exports = router;

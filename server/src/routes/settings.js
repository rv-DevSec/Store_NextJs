const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/auth');

router.get('/', getSettings);
router.put('/', protect, admin, updateSettings);

module.exports = router;

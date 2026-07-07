const router = require('express').Router();
const upload = require('../middlewares/upload');
const { uploadImage, uploadMultipleImages } = require('../controllers/uploadController');
const { protect, admin } = require('../middlewares/auth');

router.post('/image', protect, admin, upload('image'), uploadImage);
router.post('/images', protect, admin, upload('images', 10), uploadMultipleImages);

module.exports = router;

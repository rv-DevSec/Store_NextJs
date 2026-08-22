const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middlewares/auth');
const { adminLimiter } = require('../middlewares/rateLimiter');
const {
  backupProducts,
  backupOrders,
  backupUsers,
  backupAll,
  restoreProducts,
  restoreOrders,
  restoreUsers,
  previewBackup,
} = require('../controllers/backupController');

const jsonUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `backup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.json`),
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.json') return cb(new Error('فقط فایل JSON مجاز است'), false);
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(protect, admin, adminLimiter);

router.get('/backup/products', backupProducts);
router.get('/backup/orders', backupOrders);
router.get('/backup/users', backupUsers);
router.get('/backup/all', backupAll);

router.post('/restore/preview', jsonUpload.single('file'), previewBackup);
router.post('/restore/products', jsonUpload.single('file'), restoreProducts);
router.post('/restore/orders', jsonUpload.single('file'), restoreOrders);
router.post('/restore/users', jsonUpload.single('file'), restoreUsers);

module.exports = router;

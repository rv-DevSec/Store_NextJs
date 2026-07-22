const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

const MAGIC_BYTES = {
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  xlsx: [0x50, 0x4b, 0x03, 0x04],
  xls: [0xd0, 0xcf, 0x11, 0xe0],
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('فقط فرمت‌های jpg, jpeg, png مجاز هستند'), false);
  }
  cb(null, true);
};

const validateFileContent = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  const magic = MAGIC_BYTES[ext];
  if (!magic) return;

  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    await fd.read(buffer, 0, 8, 0);
    const matches = magic.every((byte, idx) => buffer[idx] === byte);
    if (!matches) throw new Error('محتوای فایل با فرمت اعلام شده مطابقت ندارد');
  } finally {
    await fd.close();
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadWithValidation = (fieldName, maxCount) => {
  const uploadMiddleware = maxCount ? upload.array(fieldName, maxCount) : upload.single(fieldName);
  return async (req, res, next) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.log('[UPLOAD_ERR]', err instanceof multer.MulterError ? 'MulterError' : 'Error', 'code:', err.code, 'message:', err.message);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد' });
          }
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      const files = req.files || (req.file ? [req.file] : []);
      try {
        for (const f of files) {
          await validateFileContent(f.path);
        }
      } catch (validationErr) {
        console.log('[UPLOAD_VALIDATION_ERR]', validationErr.message);
        for (const f of files) {
          fs.unlink(f.path, () => {});
        }
        return res.status(400).json({ success: false, message: validationErr.message });
      }

      next();
    });
  };
};

module.exports = uploadWithValidation;
module.exports.validateFileContent = validateFileContent;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const config = require('./config');
const connectDB = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');
const { globalLimiter } = require('./middlewares/rateLimiter');
const sanitizeBody = require('./middlewares/sanitize');
const routes = require('./routes');
const { generateSitemap } = require('./controllers/sitemapController');

const app = express();

connectDB();

app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', config.clientUrl],
      connectSrc: ["'self'", config.clientUrl],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null,
    },
  },
  strictTransportSecurity: config.nodeEnv === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  referrerPolicy: { policy: 'same-origin' },
}));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'deny',
  index: false,
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');
  },
}));

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.use('/api', mongoSanitize());
app.use('/api', hpp());
app.use('/api', sanitizeBody);
app.use('/api', globalLimiter);

const REDACTED_PARAMS = /([?&](?:token|password|secret|key|code|resetToken|api[_-]?key|authorization))=[^&\s]+/gi;
const sanitizeMorganToken = (token) => token ? token.replace(REDACTED_PARAMS, '$1=REDACTED') : token;
morgan.token('url-redacted', (req) => sanitizeMorganToken(req.originalUrl || req.url));
app.use(morgan(config.nodeEnv === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url-redacted HTTP/:http-version" :status :res[content-length]'
  : ':method :url-redacted :status :response-time ms - :res[content-length]'));

app.get('/sitemap.xml', generateSitemap);

app.use('/api', routes);

// Next.js serves the frontend; Express only serves the API.

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

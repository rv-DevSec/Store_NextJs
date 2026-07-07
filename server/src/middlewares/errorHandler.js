const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  const message = err.expose ? err.message : (isDev ? (err.message || 'خطای داخلی سرور') : 'خطای داخلی سرور');

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });

  if (statusCode === 500) {
    console.error(`[ERROR] ${err.message}`, isDev ? err.stack : '');
  }
};

class AppError extends Error {
  constructor(message, statusCode, expose = true) {
    super(message);
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

module.exports = { errorHandler, AppError };

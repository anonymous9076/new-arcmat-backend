function errorHandler(err, req, res, next) {
  // If response already sent, delegate to default handler
  if (res.headersSent) return next(err);

  let statusCode = err && (err.status || err.statusCode) ? (err.status || err.statusCode) : 500;
  let message = err && err.message ? err.message : String(err) || "Internal Server Error";

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err && err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
    message = `${capitalizedField} already exists`;
    statusCode = 409;
  }

  console.error(err);
  res.status(statusCode).json({ status: "failed", message });
}

export default errorHandler;


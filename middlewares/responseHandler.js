export function success(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ status: "successful", data });
}

export function fail(res, error = {}, statusCode = 500) {
  let message = error && error.message ? error.message : String(error);

  // Handle MongoDB Duplicate Key Error (E11000)
  if (error && error.code === 11000 && error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
    const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
    message = `${capitalizedField} already exists`;
    statusCode = 409; // Conflict
  }

  return res.status(statusCode).json({ status: "failed", message });
}

export function sendErrorResponse(error, message, res, status = 400) {
  const errorMessage = error?.message || "Lỗi hệ thống";
  const stackTrace = error?.stack || null;

  // Log lỗi chi tiết (chỉ nên dùng trong dev)
  console.error(`[ERROR] Status: ${status}`);
  console.error(`Message: ${message}`);
  console.error(`Error: ${errorMessage}`);
  if (stackTrace) console.error(`Stack: ${stackTrace}`);

  return res.status(status).json({
    success: false,
    message,
    error: errorMessage,
    code: error?.code || undefined, // nếu có mã lỗi riêng
  });
}


export function parsePagination(query, defaultLimit = 10, maxLimit = 100) {
  const rawPage = parseInt(query.page);
  const rawLimit = parseInt(query.limit);

  if (isNaN(rawPage) || rawPage < 1) {
    return { valid: false, message: "Trang không hợp lệ" };
  }
  if (isNaN(rawLimit) || rawLimit < 1) {
    return { valid: false, message: "Giới hạn không hợp lệ" };
  }

  const page = rawPage;
  const limit = Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip, valid: true };
}

export function parseSort(query, defaultSort = "createdAt") {
  const sortBy = query.sort || defaultSort;
  const sortOrder = query.direction === "desc" ? -1 : 1;

  return { [sortBy]: sortOrder };
}

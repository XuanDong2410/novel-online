
export function parsePagination(query, defaultLimit = 10, maxLimit = 100) {
  const rawPage = parseInt(String(query.page));
  const rawLimit = parseInt(String(query.limit || defaultLimit));

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

export function parseSort(query, defaultSort = "createdAt", allowedSortFields = []) {
  const sortBy = query.sort && allowedSortFields.includes(query.sort) ? query.sort : defaultSort;
  const direction = query.direction === "desc" ? 'desc' : 'asc';

  return { [sortBy]: direction === 'desc' ? -1 : 1 };
}

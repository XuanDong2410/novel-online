
/**
 * Validates novel existence and permissions
 * @param {Object} novel - Novel document
 * @param {Object} user - Authenticated user
 * @param {string[]} allowedStatuses - Allowed publish statuses
 * @returns {Object} - { valid: boolean, message: string }
 */
export async function validateNovel(novel, user, allowedStatuses = []) {
  if (!novel) {
    return { valid: false, message: 'Truyện không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(novel.statusPublish)) {
    return { valid: false, message: `Truyện không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  if (novel.createdBy.toString() !== user._id.toString()) {
    return { valid: false, message: `'Không có quyền thực hiện hành động này, 'createdBy': ${novel.createdBy._id}, 'user._id': ${user._id}` };
  }
  return { valid: true, message: '' };
}
/**
 * Validates chapter existence and permissions
 * @param {Object} chapter - Chapter document
 * @param {Object} user - Authenticated user
 * @param {string[]} allowedStatuses - Allowed status values
 * @returns {Object} - { valid: boolean, message: string }
 */

export async function validateChapter(chapter, allowedStatuses = []) {
  if (!chapter) {
    return { valid: false, message: 'Chương không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(chapter.status)) {
    return { valid: false, message: `Chương không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  return { valid: true, message: '' };
}
/**
 * Validates appeal existence and permissions
 * @param {Object} appeal - Appeal document
 * @param {Object} user - Authenticated user
 * @param {string[]} allowedStatuses - Allowed status values
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateAppeal(appeal, user, allowedStatuses = []) {
  if (!appeal) {
    return { valid: false, message: 'Kháng cáo không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(appeal.status)) {
    return { valid: false, message: `Kháng cáo không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  if (appeal.userId && appeal.userId.toString() !== user._id.toString()) {
    return { valid: false, message: `${appeal._id} ${appeal.userId } ${user._id.toString()}. Bạn không có quyền thực hiện hành động này` };
  }
  return { valid: true, message: '' };
}
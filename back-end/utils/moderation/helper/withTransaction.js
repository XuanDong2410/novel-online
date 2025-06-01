/**
 * Thực thi một hàm callback trong phiên giao dịch MongoDB, đảm bảo tính ACID của thao tác.
 * 
 * Giao dịch MongoDB đảm bảo:
 * - Tính nguyên tử (Atomicity): Tất cả thao tác trong giao dịch hoặc được thực hiện hoàn toàn hoặc không thực hiện.
 * - Tính nhất quán (Consistency): Dữ liệu luôn ở trạng thái hợp lệ trước và sau giao dịch.
 * - Tính cô lập (Isolation): Các giao dịch độc lập với nhau.
 * - Tính bền vững (Durability): Kết quả giao dịch được lưu trữ vĩnh viễn.
 * 
 * @async
 * @param {Function} callback - Hàm callback chứa logic nghiệp vụ cần thực thi trong giao dịch.
 * Callback nhận một tham số là đối tượng session, cần được truyền vào trong các thao tác DB.
 * @returns {Promise<*>} Kết quả trả về từ hàm callback nếu giao dịch thành công
 * @throws {Error} Ném ra lỗi từ callback và tự động rollback giao dịch nếu có lỗi xảy ra
 * 
 */

export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

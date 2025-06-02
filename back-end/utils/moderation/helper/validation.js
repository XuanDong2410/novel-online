import Joi from "joi";
import mongoose from "mongoose";

export function validateNovel(novel, session) {
  if (!novel) {
    if (session) session?.abortTransaction?.();
    return { valid: false, message: "Truyện không tồn tại" };
  }
  if (novel.isHidden) {
    if (session) session?.abortTransaction?.();
    return { valid: false, message: "Truyện đã bị ẩn" };
  }
  if (!["pending", "editing"].includes(novel.statusPublish)) {
    return { valid: false, message: "Trạng thái truyện không hợp lệ để kiểm duyệt" };
  }
  return { valid: true, message: "" };
}
// export function validateNovel(novel) {
//   if (!novel) {
//     return { valid: false, message: "Truyện không tồn tại" };
//   }
//   if (novel.isHidden) {
//     return { valid: false, message: "Truyện đã bị ẩn" };
//   }
//   if (!["pending", "editing"].includes(novel.statusPublish)) {
//     return { valid: false, message: "Trạng thái truyện không hợp lệ để kiểm duyệt" };
//   }
//   return { valid: true, message: "" };
// }

export function validateNote(note) {
  if (note === undefined) {
    return { valid: false, message: "Ghi chú là bắt buộc" };
  }
  const schema = Joi.object({
    note: Joi.string().max(2000).required().messages({
      "string.max": "Ghi chú không được vượt quá 2000 ký tự",
      "any.required": "Ghi chú là bắt buộc",
    }),
  });
  const { error } = schema.validate({ note });
  if (error) {
    return { valid: false, message: error.details[0].message };
  }
  return { valid: true, message: "" };
}
export const validateModerationInput = (noteCheck, novelCheck, res) => {
  // Kiểm tra null/undefined và định dạng hợp lệ
  if (
    !noteCheck ||
    !novelCheck ||
    typeof noteCheck.valid !== "boolean" ||
    typeof novelCheck.valid !== "boolean" ||
    !("message" in noteCheck) ||
    !("message" in novelCheck)
  ) {
    return sendErrorResponse(null, "Dữ liệu kiểm tra không hợp lệ", res, 400);
  }
  // Kiểm tra tính hợp lệ của noteCheck và novelCheck
  if (!noteCheck.valid || !novelCheck.valid) {
    const message =
      [noteCheck.message, novelCheck.message].filter(Boolean).join(". ") ||
      "Dữ liệu không hợp lệ";
    return sendErrorResponse(null, message, res, 400);
  }
  return true;
};
export function validateId(id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendErrorResponse(null, "ID không hợp lệ", res, 400);
  }
  return id;
}
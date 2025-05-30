import Joi from "joi";

export const validateSignup = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .max(255)
      .messages({
        "string.email": "Email không hợp lệ",
        "string.max": "Email quá dài",
        "any.required": "Email là bắt buộc",
      }),
    password: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
        "string.max": "Mật khẩu quá dài",
        "any.required": "Mật khẩu là bắt buộc",
      }),
    username: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        "string.min": "Tên người dùng phải có ít nhất 3 ký tự",
        "string.max": "Tên người dùng quá dài",
        "any.required": "Tên người dùng là bắt buộc",
      }),
  });

  return schema.validate(data);
};

export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .max(255)
      .messages({
        "string.email": "Email không hợp lệ",
        "string.max": "Email quá dài",
        "any.required": "Email là bắt buộc",
      }),
    password: Joi.string()
      .required()
      .messages({
        "any.required": "Mật khẩu là bắt buộc",
      }),
  });

  return schema.validate(data);
};


// Hàm validateCreateNovel (giữ nguyên từ trước)
export const validateCreateNovel = (data) => {
  const schema = Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .trim()
      .required()
      .messages({
        "string.min": "Tiêu đề phải có ít nhất 3 ký tự",
        "string.max": "Tiêu đề không được vượt quá 200 ký tự",
        "any.required": "Tiêu đề là bắt buộc",
      }),
    description: Joi.string()
      .min(10)
      .max(2000)
      .trim()
      .required()
      .messages({
        "string.min": "Mô tả phải có ít nhất 10 ký tự",
        "string.max": "Mô tả không được vượt quá 2000 ký tự",
        "any.required": "Mô tả là bắt buộc",
      }),
    author: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .required()
      .messages({
        "string.min": "Tên tác giả phải có ít nhất 3 ký tự",
        "string.max": "Tên tác giả không được vượt quá 100 ký tự",
        "any.required": "Tên tác giả là bắt buộc",
      }),
    attributes: Joi.array()
      .items(Joi.string().hex().length(24))
      .optional()
      .messages({
        "array.includes": "Thuộc tính không hợp lệ",
      }),
    tags: Joi.array()
      .items(Joi.string().max(50))
      .optional()
      .messages({
        "string.max": "Tag không được vượt quá 50 ký tự",
      }),
    coverImage: Joi.string()
      .max(500)
      .optional()
      .messages({
        "string.max": "URL ảnh bìa không được vượt quá 500 ký tự",
      }),
  });

  return schema.validate(data);
};
export const validateCreateChapter = (data) => {
  const schema = Joi.object({
    novelId: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        "string.hex": "ID truyện không hợp lệ",
        "string.length": "ID truyện phải có độ dài 24 ký tự",
        "any.required": "ID truyện là bắt buộc",
      }),
    title: Joi.string()
      .min(3)
      .max(200)
      .trim()
      .required()
      .messages({
        "string.min": "Tiêu đề chương phải có ít nhất 3 ký tự",
        "string.max": "Tiêu đề chương không được vượt quá 200 ký tự",
        "any.required": "Tiêu đề chương là bắt buộc",
      }),
    content: Joi.string()
      .min(10)
      .max(50000)
      .trim()
      .required()
      .messages({
        "string.min": "Nội dung chương phải có ít nhất 10 ký tự",
        "string.max": "Nội dung chương không được vượt quá 50,000 ký tự",
        "any.required": "Nội dung chương là bắt buộc",
      }),
    chapterNumber: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        "number.integer": "Số chương phải là số nguyên",
        "number.min": "Số chương phải lớn hơn hoặc bằng 1",
        "any.required": "Số chương là bắt buộc",
      }),
  });

  return schema.validate(data);
};

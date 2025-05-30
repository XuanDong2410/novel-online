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
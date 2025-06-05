/**
 * Unified validator for input and business logic validation
 * @module UnifiedValidator
 */

import Joi from "joi";
import mongoose from "mongoose";
import { sendErrorResponse } from "../sendErrorResponse.js";

// Extend Joi with MongoDB ObjectId support
const JoiObjectId = Joi.extend((joi) => ({
  type: "objectId",
  messages: {
    "objectId.invalid": "{{#label}} must be a valid MongoDB ObjectId",
  },
  validate(value, helpers) {
    if (!mongoose.isValidObjectId(value)) {
      return { value, errors: helpers.error("objectId.invalid") };
    }
    return { value };
  },
}));

// Mongoose schema to Joi schema converter
const mongooseSchemaToJoi = (mongooseSchema) => {
  const joiSchema = {};
  for (const [key, field] of Object.entries(mongooseSchema.paths)) {
    let rule = null;
    switch (field.instance.toLowerCase()) {
      case "string":
        rule = Joi.string();
        if (field.options.minLength) rule = rule.min(field.options.minLength);
        if (field.options.maxLength) rule = rule.max(field.options.maxLength);
        if (field.options.enum) rule = rule.valid(...field.options.enum);
        if (field.options.trim) rule = rule.trim();
        if (field.options.lowercase) rule = rule.lowercase();
        break;
      case "number":
        rule = Joi.number();
        if (field.options.min) rule = rule.min(field.options.min);
        if (field.options.max) rule = rule.max(field.options.max);
        break;
      case "boolean":
        rule = Joi.boolean();
        break;
      case "date":
        rule = Joi.date();
        break;
      case "objectid":
        rule = Joi.alternatives().try(
          JoiObjectId.objectId(),
          Joi.object().keys({
            _id: JoiObjectId.objectId().required(),
            title: Joi.string().optional(),
            username: Joi.string().optional(),
          })
        );
        if (!field.isRequired) rule = rule.allow(null);
        break;
      case "array":
        if (field.schema) {
          rule = Joi.array().items(mongooseSchemaToJoi(field.schema));
        } else if (field.caster?.instance === "ObjectId") {
          rule = Joi.array().items(JoiObjectId.objectId());
        } else {
          rule = Joi.array();
        }
        break;
      default:
        rule = Joi.any();
    }
    if (field.isRequired) rule = rule.required();
    joiSchema[key] = rule;
  }
  return Joi.object(joiSchema);
};

// Standard schemas
export const schemas = {
  signup: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(255)
      .required()
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
  }),
  login: Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .max(255)
      .required()
      .messages({
        "string.email": "Email không hợp lệ",
        "string.max": "Email quá dài",
        "any.required": "Email là bắt buộc",
      }),
    password: Joi.string().required().messages({
      "any.required": "Mật khẩu là bắt buộc",
    }),
  }),
  createNovel: Joi.object({
    title: Joi.string().min(3).max(200).trim().required().messages({
      "string.min": "Tiêu đề phải có ít nhất 3 ký tự",
      "string.max": "Tiêu đề không được vượt quá 200 ký tự",
      "any.required": "Tiêu đề là bắt buộc",
    }),
    description: Joi.string().min(10).max(2000).trim().required().messages({
      "string.min": "Mô tả phải có ít nhất 10 ký tự",
      "string.max": "Mô tả không được vượt quá 2000 ký tự",
      "any.required": "Mô tả là bắt buộc",
    }),
    author: Joi.string().min(3).max(100).trim().required().messages({
      "string.min": "Tên tác giả phải có ít nhất 3 ký tự",
      "string.max": "Tên tác giả không được vượt quá 100 ký tự",
      "any.required": "Tên tác giả là bắt buộc",
    }),
    attributes: Joi.array().items(JoiObjectId.objectId()).optional().messages({
      "array.includes": "Thuộc tính không hợp lệ",
    }),
    tags: Joi.array().items(Joi.string().max(50)).optional().messages({
      "string.max": "Tag không được vượt quá 50 ký tự",
    }),
    coverImage: Joi.string().max(500).optional().messages({
      "string.max": "URL ảnh bìa không được vượt quá 500 ký tự",
    }),
  }),
  createChapter: Joi.object({
    novelId: JoiObjectId.objectId().required().messages({
      "objectId.invalid": "ID truyện không hợp lệ",
      "any.required": "ID truyện là bắt buộc",
    }),
    title: Joi.string().min(3).max(200).trim().required().messages({
      "string.min": "Tiêu đề chương phải có ít nhất 3 ký tự",
      "string.max": "Tiêu đề chương không được vượt quá 200 ký tự",
      "any.required": "Tiêu đề chương là bắt buộc",
    }),
    content: Joi.string().min(10).max(50000).trim().required().messages({
      "string.min": "Nội dung chương phải có ít nhất 10 ký tự",
      "string.max": "Nội dung chương không được vượt quá 50,000 ký tự",
      "any.required": "Nội dung chương là bắt buộc",
    }),
    chapterNumber: Joi.number().integer().min(1).required().messages({
      "number.integer": "Số chương phải là số nguyên",
      "number.min": "Số chương phải lớn hơn hoặc bằng 1",
      "any.required": "Số chương là bắt buộc",
    }),
  }),
  note: Joi.object({
    note: Joi.string().max(1000).required().messages({
      "string.max": "Ghi chú không được vượt quá 1000 ký tự",
      "any.required": "Ghi chú là bắt buộc",
    }),
  }),
  reportHandle: Joi.object({
    status: Joi.string().valid("reviewed", "rejected").required().messages({
      "any.only": "Trạng thái phải là reviewed hoặc rejected",
      "any.required": "Trạng thái là bắt buộc",
    }),
    note: Joi.string().max(1000).optional().messages({
      "string.max": "Ghi chú không được vượt quá 1000 ký tự",
    }),
  }),
  appealResponse: Joi.object({
    responseMessage: Joi.string().max(2000).optional().messages({
      "string.max": "Thông điệp phản hồi không được vượt quá 2000 ký tự",
    }),
  }),
  getUsersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
  updateUserRole: Joi.object({
    role: Joi.string().valid('user', 'moderator', 'admin').required().messages({
      'any.only': 'Vai trò không hợp lệ',
      'any.required': 'Vai trò là bắt buộc',
    }),
  }),
};

/**
 * Validates request body against a specified schema
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} - Express middleware
 */
export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return sendErrorResponse(null, "Schema không tồn tại", res, 500);
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join("; ");
      return sendErrorResponse(null, errorMessage, res, 400);
    }

    next();
  };
};

/**
 * Validates a document against its Mongoose schema
 * @async
 * @param {string} modelName - Name of the Mongoose model
 * @param {Object} document - Document to validate
 * @param {Object} [options] - Additional validation options
 * @param {Object} [options.session] - Mongoose session for transactions
 * @param {string[]} [options.allowedStatuses] - Allowed statuses for the document
 * @returns {Promise<Object>} - { valid: boolean, message: string }
 */
export const validateDocument = async (modelName, document, options = {}) => {
  const { session, allowedStatuses } = options;

  if (!document) {
    return { valid: false, message: `${modelName} không tồn tại` };
  }

  const Model = mongoose.model(modelName);
  const schema = mongooseSchemaToJoi(Model.schema);

  const { error } = schema.validate(document, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join("; ");
    return { valid: false, message: `Dữ liệu ${modelName} không hợp lệ: ${errorMessage}` };
  }

  if (allowedStatuses && !allowedStatuses.includes(document.status)) {
    return {
      valid: false,
      message: `Trạng thái của ${modelName} không được phép: ${document.status}`,
    };
  }

  try {
    const existingDocument = await Model.findById(document._id)
      .session(session || null)
      .lean();
    if (!existingDocument) {
      return { valid: false, message: `${modelName} không tồn tại trong cơ sở dữ liệu` };
    }
  } catch (error) {
    return { valid: false, message: `Lỗi khi kiểm tra ${modelName}: ${error.message}` };
  }

  return { valid: true, message: "" };
};

/**
 * Validates a MongoDB ObjectId
 * @param {string} id - ID to validate
 * @param {Object} res - Express response object
 * @returns {string|null} - Valid ID or null if invalid
 */
export const validateId = (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    sendErrorResponse(null, "ID không hợp lệ", res, 400);
    return null;
  }
  return id;
};

export default {
  validate,
  validateDocument,
  validateId,
};
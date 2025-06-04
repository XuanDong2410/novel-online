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
                rule = JoiObjectId.objectId();
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
const schemas = {
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
    note: Joi.string().max(1000).required().messages({
        "string.max": "Ghi chú không được vượt quá 1000 ký tự",
        "any.required": "Ghi chú là bắt buộc",
    }),
    reportHandle: Joi.object({
        status: Joi.string().valid("reviewed", "rejected").required().messages({
            "any.only": "Trạng thái phải là reviewed hoặc rejected",
            "any.required": "Trạng thái là bắt buộc",
        }),
        note: Joi.string().max(1000).optional().messages({
            "string.max": "Ghi chú không được vượt quá 1000 ký tự",
        }),
    })
};

// Validation middleware
export const validate = (schemaName, source = "body") => async (req, res, next) => {
    try {
        const schema = schemas[schemaName];
        if (!schema) {
            return sendErrorResponse(null, `Schema ${schemaName} không tồn tại`, res, 500);
        }
        const data = req[source];
        const { error } = await schema.validateAsync(data, { abortEarly: false });
        if (error) {
            const messages = error.details.map((detail) => detail.message).join("; ");
            return sendErrorResponse(null, messages, res, 400);
        }
        next();
    } catch (error) {
        return sendErrorResponse(error, "Lỗi xác thực dữ liệu", res, 500);
    }
};

// Business logic validation
export const validateDocument = async (type, document, options = {}) => {
    const { session, user, allowedStatuses = [], checkOwnership = false } = options;

    if (!document) {
        if (session) await session.abortTransaction();
        return { valid: false, message: `${type} không tồn tại` };
    }

    if (allowedStatuses.length && !allowedStatuses.includes(document.status || document.statusPublish)) {
        return {
            valid: false,
            message: `${type} không ở trạng thái cho phép: ${allowedStatuses.join(", ")}`,
        };
    }

    if (checkOwnership && document.createdBy?.toString() !== user?._id?.toString()) {
        return {
            valid: false,
            message: `Không có quyền thực hiện hành động này`,
        };
    }

    if (type === "Novel" && document.isHidden) {
        if (session) await session.abortTransaction();
        return { valid: false, message: "Truyện đã bị ẩn" };
    }

    return { valid: true, message: "" };
};

// Validate MongoDB ObjectId
export const validateId = (id, res) => {
    if (!mongoose.isValidObjectId(id)) {
        sendErrorResponse(null, "ID không hợp lệ", res, 400);
        return null;
    }
    return id;
};

// // Example: Apply to Novel model
// import Novel from "../models/novel.model.js";
// import Chapter from "../models/chapter.model.js";

// export const novelSchema = mongooseSchemaToJoi(Novel.schema);
// export const chapterSchema = mongooseSchemaToJoi(Chapter.schema);

// Usage in controllers
/*
import { validate, validateDocument, validateId } from "../utils/validator/unifiedValidator.js";

router.post("/novels", validate("createNovel"), async (req, res) => { ... });
router.patch("/novels/:id/approve", async (req, res) => {
  const novelId = validateId(req.params.id, res);
  if (!novelId) return;
  const novel = await Novel.findById(novelId);
  const check = await validateDocument("Novel", novel, {
    session: req.session,
    allowedStatuses: ["pending", "editing"],
  });
  if (!check.valid) {
    return sendErrorResponse(null, check.message, res, 400);
  }
  ...
});
*/
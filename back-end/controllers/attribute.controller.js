import { NovelAttribute } from '../models/novel.model.js';
// controllers/attribute.controller.js
export const getAttributes = async (req, res) => {
  try {
    const attributes = await NovelAttribute.find({ isActive: true })
      .select('_id name type description')
      .lean();

    res.json({ 
      success: true,
      data: attributes 
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'Lỗi khi lấy thuộc tính', error);
  }
};

// controllers/attribute.controller.js
export const getAttributesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { includeInactive = 'false' } = req.query;

    // 1. Build query
    const query = { type };
    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    // 2. Fetch from DB
    const attributes = await NovelAttribute.find(query)
      .select('_id name type description isActive')
      .sort({ name: 1 }) // Sắp xếp A-Z
      .lean();

    // 3. Format response
    const response = {
      meta: {
        type,
        count: attributes.length,
        hasInactive: includeInactive === 'true'
      },
      data: attributes
    };

    res.json({ 
      success: true,
      ...response 
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ATTRIBUTE_FETCH_ERROR',
        message: 'Lỗi khi lấy danh sách thuộc tính',
        details: error.message
      }
    });
  }
};
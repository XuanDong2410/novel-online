// Dữ liệu ánh xạ danh sách tĩnh với type
import { NovelAttribute } from '../../models/novel.model.js';
import { sendErrorResponse } from '../../utils/sendErrorResponse.js';
 // Điều chỉnh đường dẫn theo cấu trúc dự án
import {
  NovelGenreList,
  NovelSubGenreList,
  NovelCharacterTraitList,
  NovelWorldBuildingList,
  NovelAudienceList
} from '../../../front-end/app/types/novelType.js';
import mongoose from 'mongoose';
 // Điều chỉnh đường dẫn theo cấu trúc dự án
const attributeLists = [
  { type: 'genre', items: NovelGenreList },
  { type: 'subgenre', items: NovelSubGenreList },
  { type: 'character', items: NovelCharacterTraitList },
  { type: 'world', items: NovelWorldBuildingList },
  { type: 'audience', items: NovelAudienceList }
];

/**
 * Hàm đổ dữ liệu vào NovelAttribute
 * @returns {Promise<void>}
 */
export async function seedNovelAttributes() {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const { type, items } of attributeLists) {
      console.log(`Processing ${type} attributes...`);

      for (const name of items) {
        // Kiểm tra xem bản ghi đã tồn tại chưa
        const existingAttribute = await NovelAttribute.findOne({ name, type }).session(session);
        if (existingAttribute) {
          console.log(`Skipped: ${type} - ${name} (already exists)`);
          totalSkipped++;
          continue;
        }

        // Tạo bản ghi mới
        const newAttribute = new NovelAttribute({
          name: name.trim(),
          type,
          description: '', // Để trống vì không có dữ liệu
          isActive: true
        });

        await newAttribute.save({ session });
        console.log(`Created: ${type} - ${name}`);
        totalCreated++;
      }
    }

    await session.commitTransaction();
    console.log(`Seeding completed: ${totalCreated} attributes created, ${totalSkipped} attributes skipped.`);
  } catch (error) {
    await session.abortTransaction();
    console.error('Error seeding NovelAttributes:', error);
    throw error;
  } finally {
    session.endSession();
  }
} // Điều chỉnh đường dẫn theo cấu trúc dự án

/**
 * Lấy tất cả NovelAttribute, nhóm theo type
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response với các NovelAttribute được nhóm theo type
 */
export const getGroupedNovelAttributes = async (req, res) => {
  try {
    // Lấy query parameter isActive (mặc định true)
    const isActive = req.query.isActive !== 'false';

    // Truy vấn tất cả NovelAttribute với điều kiện
    const attributes = await NovelAttribute.find({ isActive })
      .select('_id name type description') // Chỉ lấy các trường cần thiết
      .lean(); // Chuyển thành plain JavaScript object để xử lý nhanh hơn

    // Nhóm theo type
    const groupedAttributes = {
      genre: [],
      subgenre: [],
      character: [],
      world: [],
      audience: []
    };

    // Duyệt qua danh sách attributes và phân loại
    attributes.forEach(attr => {
      if (groupedAttributes[attr.type]) {
        groupedAttributes[attr.type].push({
          _id: attr._id.toString(), // Chuyển ObjectId thành chuỗi
          name: attr.name,
          type: attr.type,
          description: attr.description || ''
        });
      }
    });

    // Kiểm tra xem có dữ liệu không
    const totalAttributes = Object.values(groupedAttributes).reduce((sum, arr) => sum + arr.length, 0);
    const message = totalAttributes > 0 ? 'Lấy thuộc tính thành công' : 'Không tìm thấy thuộc tính nào';

    return res.status(200).json({
      success: true,
      message,
      data: groupedAttributes
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy thuộc tính', res, 500);
  }
};

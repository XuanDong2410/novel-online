import slugify from "slugify";
// Hàm chuẩn hóa tên (loại bỏ dấu, khoảng trắng, viết thường)
export const formatName = (name) => {
    // Kiểm tra nếu name không phải là chuỗi, mặc định cho nó là một chuỗi rỗng
    if (typeof name !== "string") {
        console.error("Warning: Invalid name provided, using empty string.");
        name = "";
    }
    return slugify(name, {
        lower: true, // Chuyển thành chữ thường
        strict: true, // Loại bỏ ký tự đặc biệt
        locale: "vi" // Hỗ trợ chuẩn hóa tiếng Việt
    }).replace(/-+/g, "-"); // Loại bỏ dấu "-" dư thừa;
};
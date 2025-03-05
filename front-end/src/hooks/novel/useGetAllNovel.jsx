import { useEffect, useState } from "react";
import axios from "axios";

const useGetAllNovel = () => {
    const [allNovel, setAllNovel] = useState([]); // Khởi tạo là mảng rỗng thay vì null
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNovels = async () => {
            try {
                const res = await axios.get("/api/v1/novel/"); // Thêm dấu / đầu tiên nếu cần
                setAllNovel(res.data.data || []); // Đảm bảo luôn trả về mảng
            } catch (error) {
                console.error("Lỗi API:", error);
                setAllNovel([]); // Đặt thành mảng rỗng nếu lỗi
            } finally {
                setLoading(false);
            }
        };
        fetchNovels();
    }, []);

    return { allNovel, loading };
};

export default useGetAllNovel;
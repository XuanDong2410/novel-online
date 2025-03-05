import { useEffect, useState } from "react";
import axios from "axios";
import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton";

const ChapterList = ({ novelId }) => {
  const [allChapter, setAllChapter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const res = await axios.get(`/api/v1/chapter/get/${novelId}`);
        console.log("Dữ liệu từ API:", res.data.data); // Kiểm tra dữ liệu
        setAllChapter(res.data.data);
        setError(null);
      } catch (error) {
        console.error("Lỗi API:", error);
        setError("Không thể tải danh sách chương");
        setAllChapter([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, [novelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-10">
        <WatchPageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-h-[500px] mx-auto container px-4 py-8 h-full text-white">
        <p>{error}</p>
      </div>
    );
  }

  if (!Array.isArray(allChapter) || !allChapter.length) {
    return (
      <div className="max-h-[500px] mx-auto container px-4 py-8 h-full text-white">
        <p>Không tìm thấy chương nào</p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto mx-auto container px-4 py-8 text-white">
      <ul role="list" className="divide-y divide-gray-800">
        {allChapter.map((chapter, index) => (
          <li
            key={chapter.id || `chapter-${index}`} // Đảm bảo key duy nhất
            className="py-4 hover:bg-gray-900 transition-colors duration-200"
          >
            <a
              href={`/chapter/${chapter.id}`}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-2 sm:gap-x-6"
            >
              {/* Tên chương */}
              <div className="flex items-center min-w-0 gap-x-4">
                <p className="text-sm font-semibold text-white line-clamp-1">
                  {chapter.title}
                </p>
              </div>

              {/* Số chương - Hiển thị dọc trên mobile, ngang trên desktop */}
              {chapter.chapterNumber && (
                <span className="text-xs text-gray-400 sm:text-white">
                  Chương {chapter.chapterNumber}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChapterList;
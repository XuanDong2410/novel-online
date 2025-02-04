import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton";
import ChapterContent from "../../components/novels/ChapterContent";

const WatchChapter = () => {
    const { novelId, chapterId } = useParams();
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                const res = await axios.get(`/api/v1/chapter/${novelId}/chapters/${chapterId}`);
                setChapter(res.data.data);
            } catch (err) {
                setError("Có lỗi xảy ra khi tải dữ liệu chương: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchChapter();
    }, [novelId, chapterId]);

    if (loading) return <WatchPageSkeleton />;
    if (error) {
        console.error(error);
        return <WatchPageSkeleton />;
    }

    if (!chapter) {
        return (
            <div className="bg-black text-white h-screen">
                <div className="max-w-6xl mx-auto">
                    <Navbar />
                    <div className="text-center mx-auto px-4 py-8 h-full mt-40">
                        <h2 className="text-2xl sm:text-5xl font-bold">Novel not found 😥</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen text-white">
            <div className="mx-auto container px-2 h-full">
                <Navbar />
                <ChapterContent chapter={chapter} />
            </div>
        </div>
    );
};

export default WatchChapter;

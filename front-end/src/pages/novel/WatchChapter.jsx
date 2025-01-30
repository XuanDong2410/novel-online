import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton";

const WatchChapter = () => {
    const { novelId, chapterId } = useParams();
    const [fetchSubtitles] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [hoveredSentence, setHoveredSentence] = useState(null);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(null);
    const audioRef = useRef(null);

    // Chuyển đổi thời gian VTT (hh:mm:ss) sang giây
    const timeToSeconds = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(":").map(Number.parseFloat);
        return hours * 3600 + minutes * 60 + seconds;
    };

    // Fetch dữ liệu chương + phụ đề
    useEffect(() => {
        
    // Fetch phụ đề VTT
        const fetchSubtitles = async (url) => {
            try {
                const response = await axios.get(url);
                const parsedSubtitles = parseSubtitles(response.data);
                setSubtitles(parsedSubtitles);
            } catch (err) {
                console.error("Lỗi khi tải file phụ đề:", err);
            }
        };

        // Parse file VTT
        const parseSubtitles = (subtitleContent) => {
            const lines = subtitleContent.trim().split("\n");
            const parsedSubtitles = [];
            let currentSubtitle = {};

            for (const line of lines) {
                if (line.includes("-->")) {
                    const [start, end] = line.split(" --> ");
                    currentSubtitle.start = timeToSeconds(start);
                    currentSubtitle.end = timeToSeconds(end);
                } else if (line.trim() !== "") {
                    currentSubtitle.text = line.trim();
                    parsedSubtitles.push({ ...currentSubtitle });
                    currentSubtitle = {};
                }
            }

            return parsedSubtitles;
        };

        const fetchChapter = async () => {
            try {
                const res = await axios.get(`/api/v1/chapter/${novelId}/chapters/${chapterId}`);
                setChapter(res.data.data);
                if (res.data.data.subtitleFileUrl) {
                    await fetchSubtitles(res.data.data.subtitleFileUrl);
                }
                setLoading(false);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setChapter([]);
                }
                setError("Có lỗi xảy ra khi tải dữ liệu chương: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchChapter();
    }, [novelId, chapterId, fetchSubtitles]);

    // Xử lý tua đến câu khi click
    const handleClick = (text) => {
        const normalizeText = (str) => str.replace(/[.,!?]/g, "").trim().toLowerCase();
        const normalizedInput = normalizeText(text);

        console.log("Câu được nhấn:", text);

        const subtitle = subtitles.find((sub) => {
            const normalizedSubtitle = normalizeText(sub.text);
            return normalizedSubtitle === normalizedInput;
        });

        if (subtitle) {
            console.log("Phụ đề tìm thấy:", subtitle);
            if (audioRef.current) {
                audioRef.current.currentTime = subtitle.start;
                audioRef.current.play();
            }
        } else {
            console.log("Không tìm thấy phụ đề phù hợp.");
        }
    };

    // Cập nhật câu đang phát dựa vào thời gian audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (!subtitles.length) return;

            const currentTime = audio.currentTime;
            const activeSubtitle = subtitles.find(
                (sub) => currentTime >= sub.start && currentTime <= sub.end
            );

            if (activeSubtitle) {
                const index = subtitles.findIndex((sub) => sub.text === activeSubtitle.text);
                setCurrentSentenceIndex(index);
                console.log("🔊 Câu đang được phát:", activeSubtitle.text);
            } else {
                setCurrentSentenceIndex(null);
            }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
    }, [subtitles]);

    if (loading) return <WatchPageSkeleton />;
    if (error) {
        console.log(error.message);
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
                <div className="chapter-detail">
                    <h1>{chapter.title}</h1>
                    <p><strong>Số chương:</strong> {chapter.chapterNumber}</p>
                    <p><strong>ID chương:</strong> {chapter._id}</p>
                    <p><strong>ID tiểu thuyết:</strong> {chapter.novelId}</p>
                    <p><strong>Ngày tạo:</strong> {new Date(chapter.createdAt).toLocaleString()}</p>
                    <p><strong>Cập nhật lần cuối:</strong> {new Date(chapter.updatedAt).toLocaleString()}</p>

                    <h2>Nội dung:</h2>
                    <div>
                        {chapter.content.split(". ").map((sentence, index) => (
                            <span 
                                key={index} 
                                onMouseEnter={() => setHoveredSentence(index)}
                                onMouseLeave={() => setHoveredSentence(null)}
                                onClick={() => handleClick(sentence.trim())} 
                                style={{ 
                                    cursor: "pointer",
                                    backgroundColor: currentSentenceIndex === index 
                                        ? "rgba(255, 255, 0, 0.5)" // Highlight câu đang phát
                                        : hoveredSentence === index 
                                            ? "rgba(255, 255, 255, 0.2)" // Highlight khi hover
                                            : "transparent",
                                    padding: "2px",
                                    borderRadius: "4px",
                                    transition: "background-color 0.2s ease-in-out"
                                }}
                            >
                                {sentence}.
                            </span>
                        ))}
                    </div>

                    <h2>Audio:</h2>
                    {chapter.audioFileUrl ? (
                        <audio ref={audioRef} controls src={chapter.audioFileUrl}>
                            Trình duyệt của bạn không hỗ trợ phát audio.
                        </audio>
                    ) : (
                        <p>Không có file audio.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WatchChapter;

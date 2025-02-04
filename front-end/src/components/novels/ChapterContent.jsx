import { useEffect, useRef, useState } from "react";
import axios from "axios";

const ChapterContent = ({ chapter }) => {
    const [subtitles, setSubtitles] = useState([]);
    const [hoveredSentence, setHoveredSentence] = useState(null);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (chapter?.subtitleFileUrl) {
            fetchSubtitles(chapter.subtitleFileUrl);
        }
    }, [chapter]);

    const fetchSubtitles = async (url) => {
        try {
            const response = await axios.get(url);
            const parsedSubtitles = parseSubtitles(response.data);
            setSubtitles(parsedSubtitles);
        } catch (err) {
            console.error("Lỗi khi tải file phụ đề:", err);
        }
    };

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

    const timeToSeconds = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(":").map(Number.parseFloat);
        return hours * 3600 + minutes * 60 + seconds;
    };

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

    return (
        <div className="chapter-detail">
            <h1>{chapter.title}</h1>
            <p><strong>Số chương:</strong> {chapter.chapterNumber}</p>
            <p><strong>ID chương:</strong> {chapter._id}</p>
            <p><strong>ID tiểu thuyết:</strong> {chapter.novelId}</p>
            <p><strong>Ngày tạo:</strong> {new Date(chapter.createdAt).toLocaleString()}</p>
            <p><strong>Cập nhật lần cuối:</strong> {new Date(chapter.updatedAt).toLocaleString()}</p>

            <h2>Nội dung:</h2>
            <div>
                {chapter.content?.split(". ").map((sentence, index) => (
                    <span 
                        key={index} 
                        onMouseEnter={() => setHoveredSentence(index)}
                        onMouseLeave={() => setHoveredSentence(null)}
                        onClick={() => handleClick(sentence.trim())} 
                        style={{ 
                            cursor: "pointer",
                            backgroundColor: currentSentenceIndex === index 
                                ? "rgba(255, 255, 0, 0.5)" 
                                : hoveredSentence === index 
                                    ? "rgba(255, 255, 255, 0.2)"
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
    );
};

export default ChapterContent;

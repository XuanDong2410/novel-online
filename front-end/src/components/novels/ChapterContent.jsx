"use client"

import { useEffect, useRef, useState } from "react"
import axios from "axios"

const ChapterContent = ({ chapter }) => {
  const [subtitles, setSubtitles] = useState([])
  const [hoveredSentence, setHoveredSentence] = useState(null)
  //const [currentSentenceIndex, setCurrentSentenceIndex] = useState(null)
  const [currentSubtitle, setCurrentSubtitle] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (chapter?.subtitleFileUrl) {
      fetchSubtitles(chapter.subtitleFileUrl)
    }
  }, [chapter])

  const fetchSubtitles = async (url) => {
    try {
      const response = await axios.get(url)
      const parsedSubtitles = parseSubtitles(response.data)
      setSubtitles(parsedSubtitles)
    } catch (err) {
      console.error("Lỗi khi tải file phụ đề:", err)
    }
  }

  const parseSubtitles = (subtitleContent) => {
    const lines = subtitleContent.trim().split("\n")
    const parsedSubtitles = []
    let currentSubtitle = {}

    for (const line of lines) {
      if (line.includes("-->")) {
        const [start, end] = line.split(" --> ")
        currentSubtitle.start = timeToSeconds(start)
        currentSubtitle.end = timeToSeconds(end)
      } else if (line.trim() !== "") {
        currentSubtitle.text = line.trim()
        parsedSubtitles.push({ ...currentSubtitle })
        currentSubtitle = {}
      }
    }
    return parsedSubtitles
  }

  const timeToSeconds = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number.parseFloat)
    return hours * 3600 + minutes * 60 + seconds
  }

  const handleClick = (text) => {
    const normalizeText = (str) => str.replace(/[.!?]/g, "").trim().toLowerCase()
    const normalizedInput = normalizeText(text)

    console.log("Câu được nhấn:", text)

    const subtitle = subtitles.find((sub) => {
      const normalizedSubtitle = normalizeText(sub.text)
      return normalizedSubtitle === normalizedInput
    })

    if (subtitle) {
      console.log("Phụ đề tìm thấy:", subtitle)
      if (audioRef.current) {
        audioRef.current.currentTime = subtitle.start
        audioRef.current.play()
      }
    } else {
      console.log("Không tìm thấy phụ đề phù hợp.")
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (!subtitles.length) return

      const currentTime = audio.currentTime
      const activeSubtitle = subtitles.find((sub) => currentTime >= sub.start && currentTime <= sub.end)

      if (activeSubtitle) {
        //const index = subtitles.findIndex((sub) => sub.text === activeSubtitle.text)
        //setCurrentSentenceIndex(index)
        setCurrentSubtitle(activeSubtitle)
        console.log("🔊 Câu phụ đề đang được phát:", activeSubtitle.text)
      } else {
        setCurrentSentenceIndex(null)
        setCurrentSubtitle(null)
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate)
  }, [subtitles])

  return (
    <div className="chapter-detail p-4">
      <h1 className="text-2xl font-bold mb-4">{chapter.title}</h1>
      <p className="mb-2">
        <strong>Số chương:</strong> {chapter.chapterNumber}
      </p>
      <p className="mb-2">
        <strong>ID chương:</strong> {chapter._id}
      </p>
      <p className="mb-2">
        <strong>ID tiểu thuyết:</strong> {chapter.novelId}
      </p>
      <p className="mb-2">
        <strong>Ngày tạo:</strong> {new Date(chapter.createdAt).toLocaleString()}
      </p>
      <p className="mb-4">
        <strong>Cập nhật lần cuối:</strong> {new Date(chapter.updatedAt).toLocaleString()}
      </p>

      <h2 className="text-xl font-semibold mb-2">Nội dung:</h2>
      <div className="whitespace-normal text-justify hyphens-auto">
        {chapter.content?.match(/[^.!?]+[.!?]/g)?.map((sentence, index) => (
            <span
                key={index}
                onMouseEnter={() => setHoveredSentence(index)}
                onMouseLeave={() => setHoveredSentence(null)}
                onClick={() => handleClick(sentence.trim())}
                style={{ 
                    cursor: "pointer",
                    backgroundColor: hoveredSentence === index 
                    ? "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                    // currentSentenceIndex === index 
                    //     ? "rgba(255, 255, 0, 0.5)" 
                    //     : 
                    padding: "2px",
                    borderRadius: "4px",
                    //transition: "background-color 0.2s ease-in-out"
                }}
                className={`
                    text-justify
                    cursor-pointer
                    p-1
                    rounded
                    transition-colors
                    duration-200
                    ${hoveredSentence === index ? "bg-gray-100" : ""}
                    `}
                    // ${currentSentenceIndex === index ? "bg-red-200" : ""}
            >
                {sentence.trim()}{" "}
            </span> 
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">Audio:</h2>
      {chapter.audioFileUrl ? (
        <audio ref={audioRef} controls src={chapter.audioFileUrl} className="w-full">
          Trình duyệt của bạn không hỗ trợ phát audio.
        </audio>
      ) : (
        <p>Không có file audio.</p>
      )}

      {/* {currentSubtitle && (
        <div className="mt-4 p-2 bg-blue-100 rounded">
          <p className="font-semibold">Câu phụ đề đang phát:</p>
          <p>{currentSubtitle.text}</p>
        </div>
      )} */}
    </div>
  )
}

export default ChapterContent


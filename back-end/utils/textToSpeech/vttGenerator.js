import fs from "fs/promises"

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0")
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  const ms = Math.floor((seconds % 1) * 1000)
    .toString()
    .padStart(3, "0")
  return `${hours}:${minutes}:${sec}.${ms}`
}

export async function createVttFile(sentences, outputPath) {
  try {
    console.log("Creating VTT file with sentences:", sentences)

    if (!Array.isArray(sentences)) {
      throw new Error("Expected sentences to be an array")
    }

    let vttContent = "WEBVTT\n\n"

    sentences.forEach((sentence, index) => {
      if (typeof sentence !== "object" || sentence === null) {
        console.error(`Invalid sentence at index ${index}:`, sentence)
        return // Skip this iteration
      }

      const { start_time, end_time, sentence: text } = sentence

      if (typeof start_time !== "number" || typeof end_time !== "number" || typeof text !== "string") {
        console.error(`Invalid sentence structure at index ${index}:`, sentence)
        return // Skip this iteration
      }

      const startTime = formatTime(start_time)
      const endTime = formatTime(end_time)
      vttContent += `${index + 1}\n${startTime} --> ${endTime}\n${text}\n\n`
    })
    
    
    await fs.writeFile(outputPath, vttContent, "utf-8")
    console.log(`✅ VTT file saved: ${outputPath}`)
  } catch (error) {
    console.error("❌ Error saving VTT file:", error)
    throw error
  }
}


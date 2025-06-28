// import fs from 'fs-extra';
import speech from '@google-cloud/speech'; // Giữ nguyên các import cần thiết

const client = new speech.SpeechClient();

function splitContent(content) {
    // Regex này có thể gây ra các chuỗi rỗng nếu có nhiều dấu chấm liên tiếp hoặc xuống dòng.
    // Đã chỉnh sửa để xử lý tốt hơn và đảm bảo câu không bị mất dấu câu ở cuối.
    const sentences = content.split(/([.!?\n]|\r\n|\r)/g).filter(s => s.trim() !== '');
    let result = [];
    let tempSentence = '';
    for (let i = 0; i < sentences.length; i++) {
        tempSentence += sentences[i];
        if (sentences[i].match(/[.!?\n]|\r\n|\r/)) { // Nếu phần tử là dấu câu hoặc xuống dòng
            result.push(tempSentence.trim());
            tempSentence = '';
        }
    }
    if (tempSentence.trim()) { // Thêm phần còn lại nếu có
        result.push(tempSentence.trim());
    }
    // Đảm bảo không có câu nào rỗng
    return result.filter(s => s.length > 0);
}


export async function transcribeAudio(content, audioUrl, languageCode = 'vi-VN') {
    try {
        console.log(`Starting transcription for audioUrl: ${audioUrl}`);

        const audio = {
            uri: audioUrl, // URI của file âm thanh trên GCS
        };

        const config = {
            encoding: 'MP3',
            sampleRateHertz: 24000, // Đảm bảo khớp với sample rate khi tạo âm thanh
            languageCode,
            enableWordTimeOffsets: true,
            // THAY ĐỔI model TỪ 'long' SANG 'default'
            model: 'default', // <-- Dòng cần chỉnh sửa
            // useEnhanced: false, // Hoặc bỏ hẳn dòng này
        };

        const request = { audio, config };

        console.log('Sending long-running speech recognition request...');
        const [operation] = await client.longRunningRecognize(request);

        console.log('Waiting for long-running operation to complete...');
        // Đặt timeout nếu cần, ví dụ 10 phút
        const [response] = await operation.promise(); // await operation.promise({ timeout: 600 * 1000 }); // 10 phút


        // Xử lý kết quả trả về từ response
        let words = [];
        response.results.forEach((result) => {
            if (result.alternatives && result.alternatives[0] && result.alternatives[0].words) {
                result.alternatives[0].words.forEach((word) => {
                    words.push({
                        word: word.word,
                        // Chuyển đổi timestamp từ protobuf Duration sang giây thập phân
                        start_time: parseFloat(word.startTime.seconds || 0) + parseFloat(word.startTime.nanos || 0) * 1e-9,
                        end_time: parseFloat(word.endTime.seconds || 0) + parseFloat(word.endTime.nanos || 0) * 1e-9,
                    });
                });
            }
        });

        // Phần logic để khớp từ với câu và tính toán start_time/end_time của câu
        const sentences = splitContent(content); // Vẫn dùng content gốc để chia câu
        const transcribedSentences = [];
        let wordIndex = 0;

        for (let sentence of sentences) {
            let sentenceWords = sentence.split(/\s+/).filter(Boolean); // Chia từ theo khoảng trắng, loại bỏ chuỗi rỗng
            let currentSentenceText = '';
            let sentenceStartTime = words[wordIndex]?.start_time || 0; // Bắt đầu từ thời gian của từ đầu tiên
            let sentenceEndTime = sentenceStartTime;

            // Đếm số từ trong câu gốc (sau khi loại bỏ khoảng trắng dư thừa)
            const originalSentenceWordsCount = sentenceWords.length; 

            let wordsAssignedToSentence = [];

            // Gán các từ được nhận dạng cho câu gốc
            for (let i = 0; i < originalSentenceWordsCount && wordIndex < words.length; i++) {
                wordsAssignedToSentence.push(words[wordIndex]);
                currentSentenceText += words[wordIndex].word + ' '; // Xây dựng lại văn bản từ các từ được nhận dạng
                wordIndex++;
            }

            if (wordsAssignedToSentence.length > 0) {
                sentenceStartTime = wordsAssignedToSentence[0].start_time;
                sentenceEndTime = wordsAssignedToSentence[wordsAssignedToSentence.length - 1].end_time;
            } else {
                // Nếu không có từ nào được gán (ví dụ, câu gốc quá ngắn hoặc nhận dạng sai)
                // Cố gắng lấy end_time của câu trước đó làm start_time, hoặc 0
                sentenceStartTime = transcribedSentences.length > 0 ? transcribedSentences[transcribedSentences.length - 1].end_time : 0;
                sentenceEndTime = sentenceStartTime + 0.1; // Gán một khoảng thời gian nhỏ mặc định
                console.warn(`Warning: No words transcribed for sentence (or very short) "${sentence.trim()}". Assigning default time range.`);
            }

            transcribedSentences.push({
                sentence: sentence.trim(), // Giữ câu gốc đã trim
                start_time: sentenceStartTime,
                end_time: sentenceEndTime,
            });
        }

        console.log('Speech recognition completed successfully.');
        return transcribedSentences;
    } catch (error) {
        console.error(`❌ Error recognizing speech: ${error.message}`);
        // Log thêm chi tiết nếu lỗi từ Google Cloud
        if (error.code && error.details) {
            console.error('Google Cloud Speech-to-Text API Detailed Error:', error.code, error.details);
        }
        throw error;
    }
}
// file: speechRecognition.js

// function splitContent(content) {
//     // Cải thiện logic chia câu để tránh các chuỗi rỗng và đảm bảo câu được trim
//     const sentences = content.split(/([.!?\n]|\r\n|\r)/g).filter(s => s.trim() !== '');
//     let result = [];
//     let tempSentence = '';
//     for (let i = 0; i < sentences.length; i++) {
//         tempSentence += sentences[i];
//         if (sentences[i].match(/[.!?\n]|\r\n|\r/)) { // Nếu phần tử là dấu câu hoặc xuống dòng
//             if (tempSentence.trim()) { // Chỉ thêm vào nếu không rỗng sau khi trim
//                 result.push(tempSentence.trim());
//             }
//             tempSentence = ''; // Đặt lại chuỗi tạm thời
//         }
//     }
//     if (tempSentence.trim()) { // Thêm phần còn lại nếu có
//         result.push(tempSentence.trim());
//     }
//     // Đảm bảo không có câu nào rỗng
//     return result.filter(s => s.length > 0);
// }


// export async function transcribeAudio(content, audioUrl, languageCode = 'vi-VN') {
//     try {
//         console.log(`Starting transcription for audioUrl: ${audioUrl}`);

//         const audio = {
//             uri: audioUrl, // URI của file âm thanh trên GCS
//         };

//         const config = {
//             encoding: 'MP3',
//             sampleRateHertz: 24000, // Đảm bảo khớp với sample rate khi tạo âm thanh
//             languageCode,
//             enableWordTimeOffsets: true,
//             model: 'default', // Sử dụng model 'default'
//             // useEnhanced: false, // Bỏ dòng này hoặc giữ nguyên nếu không dùng enhanced
//         };

//         const request = { audio, config };

//         console.log('Sending long-running speech recognition request...');
//         const [operation] = await client.longRunningRecognize(request);

//         console.log('Waiting for long-running operation to complete...');
//         const [response] = await operation.promise(); // await operation.promise({ timeout: 600 * 1000 }); // 10 phút

//         // Xử lý kết quả trả về từ response để lấy danh sách từ và dấu thời gian
//         let words = [];
//         response.results.forEach((result) => {
//             if (result.alternatives && result.alternatives[0] && result.alternatives[0].words) {
//                 result.alternatives[0].words.forEach((word) => {
//                     words.push({
//                         word: word.word,
//                         // Chuyển đổi timestamp từ protobuf Duration sang giây thập phân
//                         start_time: parseFloat(word.startTime.seconds || 0) + parseFloat(word.startTime.nanos || 0) * 1e-9,
//                         end_time: parseFloat(word.endTime.seconds || 0) + parseFloat(word.endTime.nanos || 0) * 1e-9,
//                     });
//                 });
//             }
//         });

//         // Chia nội dung gốc thành các câu
//         const sentences = splitContent(content);
//         const transcribedSentences = [];
//         let wordIndex = 0; // Con trỏ toàn cục để duyệt qua mảng `words` (các từ được nhận dạng từ STT)

//         for (let i = 0; i < sentences.length; i++) {
//             const originalSentence = sentences[i].trim();
            
//             let wordsAssignedToSentence = []; // Các từ STT được gán cho câu gốc hiện tại
//             let sentenceStartTime = -1;
//             let sentenceEndTime = -1;
            
//             // Chuẩn hóa câu gốc để so sánh (chữ thường, bỏ dấu câu)
//             const normalizedOriginalSentenceForMatch = originalSentence.toLowerCase().replace(/[.,!?;:']/g, '');
//             const originalWordsForMatch = normalizedOriginalSentenceForMatch.split(/\s+/).filter(Boolean);
            
//             let originalWordPointer = 0; // Con trỏ để duyệt qua các từ trong câu gốc đã chuẩn hóa

//             // Heuristic để gán các từ được nhận dạng (từ `words`) vào câu gốc hiện tại:
//             // Duyệt qua các từ trong mảng `words` (từ `wordIndex` trở đi)
//             // và gán chúng vào câu hiện tại miễn là chúng có vẻ phù hợp.
//             // Đây là một phương pháp "tham lam" và mang tính phỏng đoán.
//             while (wordIndex < words.length) {
//                 const currentSTTWord = words[wordIndex];
//                 const sttWordLower = currentSTTWord.word.toLowerCase();

//                 let assignedThisWord = false; // Cờ để biết từ hiện tại có được gán hay không

//                 if (originalWordPointer < originalWordsForMatch.length) {
//                     const expectedOriginalWord = originalWordsForMatch[originalWordPointer];

//                     // Thử so khớp từ STT với từ gốc mong đợi.
//                     // Sử dụng `includes` để linh hoạt hơn trong trường hợp STT nhận dạng có thể hơi khác.
//                     if (sttWordLower.includes(expectedOriginalWord) || expectedOriginalWord.includes(sttWordLower)) {
//                         wordsAssignedToSentence.push(currentSTTWord);
//                         originalWordPointer++; // Tăng con trỏ cho từ gốc vì đã khớp
//                         assignedThisWord = true;
//                     } 
//                     // Nếu không khớp trực tiếp nhưng từ STT rất ngắn (có thể là từ đệm, nhiễu)
//                     // Hoặc là từ đệm phổ biến (ví dụ: "ừm", "à")
//                     else if (sttWordLower.length <= 2 || ['uh', 'um', 'ah'].includes(sttWordLower)) { 
//                         wordsAssignedToSentence.push(currentSTTWord); // Gán từ đệm nhưng không tăng `originalWordPointer`
//                         assignedThisWord = true;
//                     }
//                     else {
//                         // Nếu không khớp và không phải từ đệm, có thể từ này thuộc về câu tiếp theo
//                         // hoặc là nhận dạng sai lớn. Ngừng gán từ cho câu hiện tại.
//                         break; 
//                     }
//                 } else {
//                     // Đã duyệt hết các từ mong đợi trong câu gốc (`originalWordsForMatch`).
//                     // Thử xem từ STT hiện tại có phải là phần kết thúc của câu này không (nếu có dấu câu, v.v.).
//                     // Đơn giản là ngừng gán từ cho câu hiện tại nếu không còn từ gốc để khớp.
//                     break; 
//                 }

//                 if (assignedThisWord) {
//                     wordIndex++; // Chỉ tăng con trỏ `words` toàn cục nếu từ được gán
//                 } else {
//                     // Nếu vì lý do nào đó từ không được gán, thoát khỏi vòng lặp để tránh lặp vô hạn.
//                     break;
//                 }
//             } // Kết thúc vòng lặp `while` gán từ cho câu hiện tại

//             // Tính toán `start_time` và `end_time` của câu dựa trên các từ đã gán
//             if (wordsAssignedToSentence.length > 0) {
//                 sentenceStartTime = wordsAssignedToSentence[0].start_time;
//                 sentenceEndTime = wordsAssignedToSentence[wordsAssignedToSentence.length - 1].end_time;
//             } else {
//                 // TRƯỜNG HỢP FALLBACK: Nếu không có từ nào được gán cho câu này
//                 // Đây là nguyên nhân tiềm ẩn gây ra sự chậm trễ tích lũy ("chậm hơn").
//                 // Đặt start_time dựa trên end_time của câu trước, hoặc 0.
//                 sentenceStartTime = transcribedSentences.length > 0 ? transcribedSentences[transcribedSentences.length - 1].end_time : 0;
//                 // Gán một khoảng thời gian mặc định rất nhỏ (0.2s) thay vì 1s để giảm lỗi tích lũy.
//                 sentenceEndTime = sentenceStartTime + 0.2; 
//                 console.warn(`Warning: No words transcribed for sentence (or very short) "${originalSentence}". Assigning default time range.`);
//             }

//             // Thêm câu đã xử lý vào danh sách kết quả
//             transcribedSentences.push({
//                 sentence: originalSentence, // Giữ câu gốc
//                 start_time: sentenceStartTime,
//                 end_time: sentenceEndTime,
//             });
//         } // Kết thúc vòng lặp `for` duyệt qua các câu gốc

//         console.log('Speech recognition completed successfully.');
//         return transcribedSentences;
//     } catch (error) {
//         console.error(`❌ Error recognizing speech: ${error.message}`);
//         // Ghi thêm chi tiết lỗi từ Google Cloud nếu có
//         if (error.code && error.details) {
//             console.error('Google Cloud Speech-to-Text API Detailed Error:', error.code, error.details);
//         }
//         throw error;
//     }
// }
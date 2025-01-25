import { validateText } from "../../utils/textValidation.js";

/**
 * Hàm xử lý endpoint POST /analyze-text
 * @param {Request} req Yêu cầu HTTP
 * @param {Response} res Phản hồi HTTP
 */
export const validate = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
        res.status(400).json({
            success: false,
            message: "Please provide the required fields"
        })
    }  

    // Gọi hàm validateText từ service
    const analysisResult = await validateText(text);

    res.status(200).json({
      message: "Analyss Successfully",
      data: analysisResult,
    });
  } catch (error) {
    console.error("Error :", error);
    res.status(400).json({ error: error.message });
  }
};


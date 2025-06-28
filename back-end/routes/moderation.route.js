import express from 'express';
import mongoose from 'mongoose';
import Chapter from '../models/chapter.model.js';
import { checkContentByAI } from '../utils/moderation/index.js';
const router = express.Router();

router.patch('/chapters/:id', async (req, res) => {
    console.log(req.params.id);
  try {
    const chapterId = req.params.id;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ error: 'Chương không tồn tại' });
    }

    const moderationResult = await checkContentByAI(chapter.content, chapterId);

    chapter.violation = {
      aiFlag: moderationResult.aiFlag,
      count: moderationResult.count,
      details: moderationResult.results,
      userReports: chapter.violation.userReports || 0,
      modConfirmed: false,
    };

    await chapter.save();

    res.json(moderationResult);
  } catch (error) {
    console.error('Lỗi kiểm duyệt:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});
router.post('/chapters/:chapterId/issues', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { category, title, description, severity, line, start, end, isManual = true } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chương không tồn tại' });
    }

    const newIssue = {
      _id: new mongoose.Types.ObjectId(),
      category,
      title,
      severity,
      description,
      line,
      start,
      end,
      resolved: false,
      isManual
    };

    chapter.violation.details.push(newIssue);
    chapter.violation.count[category] = (chapter.violation.count[category] || 0) + 1;
    chapter.violation.count.total = (chapter.violation.count.total || 0) + 1;
    if (!isManual) {
      chapter.violation.aiFlag[category] = true;
    }

    await chapter.save();
    res.json({ id: newIssue._id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/chapters/:chapterId/issues', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ error: 'Chương không tồn tại' });
    }

    const issues = chapter.violation.details || [];
    return res.status(200).json({ issues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/chapters/:chapterId/issues/:issueId', async (req, res) => {
  try {
    const { chapterId, issueId } = req.params;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ error: 'Chương không tồn tại' });
    }

    const issue = chapter.violation.details.find(
      d => d._id.toString() === issueId
    );

    if (!issue) {
      return res.status(404).json({ error: 'Vấn đề không tồn tại' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.delete('/chapters/:chapterId/issues/:issueId', async (req, res) => {
  try {
    const { chapterId, issueId } = req.params;
    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      return res.status(404).json({ error: 'Chương không tồn tại' });
    }

    // So sánh _id dưới dạng ObjectId (hoặc string) vì trong MongoDB _id là ObjectId
    const issueIndex = chapter.violation.details.findIndex(
      d => d._id.toString() === issueId
    );
    if (issueIndex === -1) {
      return res.status(404).json({ error: 'Vấn đề không tồn tại' });
    }

    const issue = chapter.violation.details[issueIndex];
    chapter.violation.details.splice(issueIndex, 1); // Xóa vấn đề

    // Đảm bảo count không âm
    if (chapter.violation.count[issue.type] > 0) { // Sử dụng issue.type
      chapter.violation.count[issue.type]--;
    }
    if (chapter.violation.count.total > 0) {
      chapter.violation.count.total--;
    }

    // Cập nhật aiFlag một cách chính xác: chỉ nếu không còn vấn đề AI nào thuộc loại này
    // và vấn đề bị xóa không phải là thủ công.
    if (!issue.isManual) { // Chỉ cập nhật aiFlag nếu vấn đề bị xóa là do AI
      const hasRemainingAiIssuesOfThisType = chapter.violation.details.some(
        d => d.type === issue.type && !d.isManual // Kiểm tra các vấn đề AI còn lại
      );
      chapter.violation.aiFlag[issue.type] = hasRemainingAiIssuesOfThisType;
    }

    await chapter.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/chapters/:chapterId/comparison', async (req, res) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chương không tồn tại' });
    }
    const aiIssues = chapter.violation.details
      .filter(d => !d.isManual)
      .map(d => ({
        _id: d._id.toString(),
        category: d.category,
        severity: d.severity,
        title: d.title,
        description: d.description,
        line: d.line
      }));
    const manualIssues = chapter.violation.details
      .filter(d => d.isManual)
      .map(d => ({
        _id: d._id.toString(),
        category: d.category, 
        severity: d.severity,
        title: d.title,
        description: d.description,
        line: d.line
      }));
      // const guidelineIssues = manualIssues.filter(m =>
      //   guidelines.some(g => g.category === m.category)
      // );
    const aiOnly = aiIssues.filter(ai => !manualIssues.some(m => m.line === ai.line && m.category === ai.category));
    const manualOnly = manualIssues.filter(m => !aiIssues.some(ai => ai.line === m.line && ai.category === ai.category));
    const matched = aiIssues.filter(ai => manualIssues.some(m => m.line === ai.line && m.category === ai.category));
    res.json({
      aiIssues,
      manualIssues,
      aiOnly,
      manualOnly,
      matched,
      stats: {
        aiCount: aiIssues.length,
        manualCount: manualIssues.length,
        matchedCount: matched.length,
        aiOnlyCount: aiOnly.length,
        manualOnlyCount: manualOnly.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
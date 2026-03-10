// Stub — implemented Day 3
const { transcribeAudio } = require('../ai/transcriber');

async function transcribe(req, res) {
  try {
    // Fallback: accept plain text if no audio file
    if (req.body.text) {
      return res.json({ success: true, data: { transcript: req.body.text } });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio provided' });
    }
    const transcript = await transcribeAudio(req.file.buffer, req.file.originalname);
    res.json({ success: true, data: { transcript } });
  } catch (err) {
    console.error('[voiceController] transcribe error:', err.message);
    res.status(500).json({ success: false, error: 'Transcription failed' });
  }
}

module.exports = { transcribe };

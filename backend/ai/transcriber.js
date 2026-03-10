const gradient = require('./gradientClient');
const fs = require('fs');
const path = require('path');

async function transcribeAudio(buffer, originalName) {
  // Write buffer to temp file
  const ext = originalName ? path.extname(originalName) || '.webm' : '.webm';
  const tmpFile = path.join(require('os').tmpdir(), `audio_${Date.now()}${ext}`);
  fs.writeFileSync(tmpFile, buffer);

  try {
    console.log('[AI] transcriber: starting whisper-large-v3...');
    const transcript = await gradient.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: 'whisper-large-v3',
    });
    console.log('[AI] transcriber result:', transcript.text?.substring(0, 100) + '...');
    return transcript.text;
  } finally {
    // Always clean up temp file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

module.exports = { transcribeAudio };

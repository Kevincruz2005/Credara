const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function saveFile(buffer, subdir, filename) {
  const dir = path.join(__dirname, '../public', subdir);
  ensureDir(dir);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/${subdir}/${filename}`; // Public URL path
}

function savePhoto(buffer, filename) {
  return saveFile(buffer, 'evidence/photos', filename);
}

function saveVideo(buffer, filename) {
  return saveFile(buffer, 'evidence/videos', filename);
}

function savePDF(buffer, filename) {
  return saveFile(buffer, 'documents', filename);
}

module.exports = { savePhoto, saveVideo, savePDF, ensureDir };

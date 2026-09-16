const path = require('path');
const fs = require('fs');

const UPLOADS_ROOT   = path.join(__dirname, '../../uploads');
const PHOTOS_DIR     = UPLOADS_ROOT;
const ADDITIONAL_DIR = path.join(UPLOADS_ROOT, 'additional');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const safeFolderName = (value) => {
  return String(value || '')
    .normalize('NFC')
    .trim()
    .replace(/[^\p{L}\p{N}\-_]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 100)
    || 'unnamed';
};

const safeFileName = (name) => {
  const ext = path.extname(name || '');
  const base = path.basename(name || '', ext);

  const safeBase = base
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}\-_]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)
    || 'file';

  const safeExt = ext
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}.]+/gu, '')
    .slice(0, 10);

  return `${safeBase}${safeExt}`;
};

const fixUploadName = (name) => {
  if (!name) return '';

  const looksBroken = /[\u00C0-\u00FF]/.test(name);
  if (!looksBroken) return name;

  try {
    const fixed = Buffer.from(name, 'latin1').toString('utf8');
    if (fixed.includes('\uFFFD')) return name;
    return fixed;
  } catch {
    return name;
  }
};

const resolveFilePath = (base, relative) => {
  if (!relative) return null;
  const normalized = String(relative)
    .split(/[\\/]+/)
    .filter(Boolean)
    .join(path.sep);
  return path.join(base, normalized);
};

const unlinkSafe = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch {}
  }
};

const removeEmptyDir = (dir) => {
  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const rest = fs.readdirSync(dir);
      if (rest.length === 0) fs.rmdirSync(dir);
    }
  } catch {}
};

module.exports = {
  UPLOADS_ROOT,
  PHOTOS_DIR,
  ADDITIONAL_DIR,
  ensureDir,
  safeFolderName,
  safeFileName,
  fixUploadName,
  resolveFilePath,
  unlinkSafe,
  removeEmptyDir
};
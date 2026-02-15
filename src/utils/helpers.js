const path = require('path');
const os = require('os');

function expandPath(filePath) {
  if (filePath && typeof filePath === 'string') {
    if (filePath.startsWith('~/') || filePath === '~') {
      return path.join(os.homedir(), filePath.slice(1));
    }
    return filePath;
  }
  return filePath;
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getSnapshotDir() {
  return expandPath('~/.env-backup');
}

module.exports = { expandPath, getTimestamp, formatSize, getSnapshotDir };

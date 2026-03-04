'use strict';

const fs = require('fs');
const { paths, log, ensureLoopDir } = require('./config');
const { runScanSession } = require('./session');

async function scan(requirement, opts = {}) {
  const p = paths();
  ensureLoopDir();

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log('info', `初始化尝试 ${attempt} / ${maxAttempts} ...`);

    const result = await runScanSession(requirement, opts);

    if (fs.existsSync(p.profile) && fs.existsSync(p.tasksFile)) {
      log('ok', '初始化完成');
      return { success: true, cost: result.cost };
    }

    if (attempt < maxAttempts) {
      log('warn', '初始化未完成，将重试...');
    }
  }

  log('error', `初始化失败：已重试 ${maxAttempts} 次，关键文件仍未生成`);
  return { success: false, cost: null };
}

module.exports = { scan };

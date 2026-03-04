'use strict';

const fs = require('fs');
const { paths, COLOR } = require('./config');

const SPINNERS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

class Indicator {
  constructor() {
    this.phase = 'thinking';
    this.step = '';
    this.spinnerIndex = 0;
    this.timer = null;
    this.lastActivity = '';
    this.sessionNum = 0;
    this.startTime = Date.now();
  }

  start(sessionNum) {
    this.sessionNum = sessionNum;
    this.startTime = Date.now();
    this.timer = setInterval(() => this._render(), 500);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.stderr.write('\r\x1b[K');
  }

  updatePhase(phase) {
    this.phase = phase;
    this._writePhaseFile();
  }

  updateStep(step) {
    this.step = step;
    this._writeStepFile();
  }

  appendActivity(toolName, summary) {
    const ts = new Date().toISOString();
    const entry = `[${ts}] ${toolName}: ${summary}`;
    this.lastActivity = entry;
    try {
      const p = paths();
      fs.appendFileSync(p.activityLog, entry + '\n', 'utf8');
    } catch { /* ignore */ }
  }

  _writePhaseFile() {
    try { fs.writeFileSync(paths().phaseFile, this.phase, 'utf8'); } catch { /* ignore */ }
  }

  _writeStepFile() {
    try { fs.writeFileSync(paths().stepFile, this.step, 'utf8'); } catch { /* ignore */ }
  }

  _render() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const spinner = SPINNERS[this.spinnerIndex % SPINNERS.length];
    this.spinnerIndex++;

    const phaseLabel = this.phase === 'thinking'
      ? `${COLOR.yellow}思考中${COLOR.reset}`
      : `${COLOR.green}编码中${COLOR.reset}`;

    let line = `\r${spinner} [Session ${this.sessionNum}] ${phaseLabel} ${mm}:${ss}`;
    if (this.step) line += ` | ${this.step}`;

    const maxWidth = process.stderr.columns || 80;
    if (line.length > maxWidth + 20) line = line.slice(0, maxWidth + 20);

    process.stderr.write(`\r\x1b[K${line}`);
  }
}

// Phase-signal logic: infer phase/step from tool calls
function inferPhaseStep(indicator, toolName, toolInput) {
  const name = (toolName || '').toLowerCase();

  if (name === 'write' || name === 'edit' || name === 'str_replace_editor' || name === 'strreplace') {
    indicator.updatePhase('coding');
  } else if (name === 'bash' || name === 'shell') {
    const cmd = typeof toolInput === 'object' ? (toolInput.command || '') : String(toolInput || '');
    if (cmd.includes('git ')) {
      indicator.updateStep('Git 操作');
    } else if (cmd.includes('npm ') || cmd.includes('pip ') || cmd.includes('pnpm ')) {
      indicator.updateStep('安装依赖');
    } else if (cmd.includes('test') || cmd.includes('curl') || cmd.includes('pytest')) {
      indicator.updateStep('测试验证');
      indicator.updatePhase('coding');
    } else {
      indicator.updatePhase('coding');
    }
  } else if (name === 'read' || name === 'glob' || name === 'grep') {
    indicator.updatePhase('thinking');
    indicator.updateStep('读取文件');
  }

  const summary = typeof toolInput === 'object'
    ? (toolInput.path || toolInput.command || toolInput.pattern || JSON.stringify(toolInput).slice(0, 80))
    : String(toolInput || '').slice(0, 80);
  indicator.appendActivity(toolName, summary);
}

module.exports = { Indicator, inferPhaseStep };

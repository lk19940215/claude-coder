/**
 * Messages 管理
 *
 * - all: 完整历史（不裁剪）
 * - current: 发送给 LLM 的消息（后续可裁剪）
 * - 每次变更自动持久化到 JSON 文件
 */

import { writeFileSync, mkdirSync } from 'fs';

export class Messages {
  constructor() {
    this.all = [];
    this.file = null;
  }

  init(logFileBase) {
    mkdirSync('logs', { recursive: true });
    this.file = logFileBase ? logFileBase.replace('.log', '-messages.json') : null;
    this._save();
  }

  push(msg) {
    this.all.push(msg);
    this._save();
  }

  /** 当前发送给 LLM 的消息（后续裁剪逻辑加在这里） */
  get current() {
    return this.all;
  }

  get length() {
    return this.all.length;
  }

  _save() {
    if (!this.file) return;
    writeFileSync(this.file, JSON.stringify(this.all, null, 2), 'utf-8');
  }
}

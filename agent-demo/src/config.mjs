/**
 * 配置与环境变量
 */

import { config } from 'dotenv';
config({ quiet: true });

export const API_KEY = process.env.ANTHROPIC_API_KEY;
export const BASE_URL = process.env.BASE_URL;
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL;
export const FALLBACK_MODEL = process.env.FALLBACK_MODEL;
export const DEBUG = process.env.AGENT_DEBUG === 'true';

export const SYSTEM_PROMPT = `你是一个 AI 编程助手。你可以使用工具来读取文件、写入文件、执行命令。

工作流程:
1. 先用 read_file 或 execute_bash 了解情况
2. 制定计划并告知用户
3. 用 write_file 修改代码，用 execute_bash 验证
4. 汇报结果

规则:
- 修改文件前先读取当前内容
- 不要执行危险命令（rm -rf /、sudo 等）
- 每步操作说明原因`;

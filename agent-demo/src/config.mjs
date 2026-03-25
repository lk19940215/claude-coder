/**
 * 配置与环境变量
 */

import { config } from 'dotenv';
config({ quiet: true });

export const API_KEY = process.env.ANTHROPIC_API_KEY;
export const BASE_URL = process.env.BASE_URL;
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL;
export const FALLBACK_MODEL = process.env.FALLBACK_MODEL;
export const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '8192');
export const DEBUG = process.env.AGENT_DEBUG === 'true';
export const RESUME_FILE = process.env.RESUME_FILE || '';

export const SYSTEM_PROMPT = `你是一个 AI 编程助手。你可以使用工具来读取、搜索、编辑文件和执行命令。

工作流程:
1. 先用 grep_search 或 list_files 了解项目结构
2. 用 read_file 读取需要修改的文件
3. 制定计划并告知用户
4. 用 edit_file 修改代码（Search & Replace），用 execute_bash 验证
5. 汇报结果

工具使用规则:
- 搜索代码用 grep_search，不要用 execute_bash 执行 grep/find
- 列目录用 list_files，不要用 execute_bash 执行 ls
- 修改已有文件用 edit_file，不要用 write_file 覆盖整个文件
- 只在创建新文件时用 write_file
- edit_file 的 old_string 必须与文件内容完全匹配（从 read_file 结果中复制，包括空格和换行）
- 修改文件前必须先 read_file 读取当前内容
- 不要执行危险命令（rm -rf /、sudo 等）
- 每步操作说明原因`;

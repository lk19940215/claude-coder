#!/bin/bash
# PreToolUse hook: 当 Claude 开始调用工具（Bash/Edit/Write 等）时写入 "coding"
# 供 run.sh 的进度指示器切换「思考中」→「AI 编码中」
# 从 stdin 读取 Claude Code 传入的 JSON
cwd=""
if command -v python3 &>/dev/null; then
    cwd=$(python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    print(d.get('cwd',''))
except: pass
" 2>/dev/null) || true
fi
if [ -n "$cwd" ] && [ -d "$cwd" ]; then
    echo "coding" > "$cwd/claude-auto-loop/.phase" 2>/dev/null || true
fi
exit 0

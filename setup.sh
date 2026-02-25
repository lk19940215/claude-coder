#!/bin/bash
# ============================================================
# Claude Auto Loop 前置配置
#
# 用法: bash claude-auto-loop/setup.sh
#
# 模块结构:
#   主流程 main()           - 交互选择 + 调用提供商写入
#   配置写入 write_*        - write_config_header, append_config_common
#   提供商 write_*_config   - Claude/GLM/DeepSeek/自定义
#   MCP configure_mcp_tools - Playwright 等
#
# 配置保存到 config.env，run.sh 加载。含 API Key，已 gitignore。
# DeepSeek 参考: https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$SCRIPT_DIR/config.env"

# ============ 颜色输出 ============
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

# ============ 主流程 ============
main() {
    echo ""
    echo "============================================"
    echo "  Claude Auto Loop 前置配置"
    echo "============================================"
    echo ""
    echo "  第一步: 模型提供商配置"
    echo "  第二步: MCP 工具配置（可选）"
    echo ""

    # 检测已有配置
    if [ -f "$CONFIG_FILE" ]; then
        log_warn "检测到已有配置文件: $CONFIG_FILE"
        source "$CONFIG_FILE"
        echo "  当前模型提供商: ${MODEL_PROVIDER:-未知}"
        echo "  当前 BASE_URL: ${ANTHROPIC_BASE_URL:-默认}"
        echo "  Playwright MCP: ${MCP_PLAYWRIGHT:-未配置}"
        echo ""
        read -p "是否重新配置？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "保留现有配置，退出"
            exit 0
        fi
        echo ""
    fi

    # 选择提供商
    echo "请选择模型提供商:"
    echo ""
    echo "  1) Claude 官方"
    echo "     需要 Anthropic API Key 或 Claude Pro/Max 订阅"
    echo "     质量最高，成本较高"
    echo ""
    echo "  2) GLM via 智谱开放平台 (open.bigmodel.cn)"
    echo "     国内直连，可选 GLM 4.7 / GLM 5"
    echo -e "     获取 API Key: ${BLUE}https://open.bigmodel.cn/usercenter/apikeys${NC}"
    echo ""
    echo "  3) GLM via Z.AI 平台 (api.z.ai)"
    echo "     海外节点，可选 GLM 4.7 / GLM 5"
    echo -e "     获取 API Key: ${BLUE}https://z.ai/manage-apikey/apikey-list${NC}"
    echo ""
    echo "  4) DeepSeek (api.deepseek.com)"
    echo -e "     ${GREEN}新用户有赠送余额${NC}，Anthropic 兼容，国内直连"
    echo -e "     获取 API Key: ${BLUE}https://platform.deepseek.com/api_keys${NC}"
    echo ""
    echo "  5) 自定义"
    echo "     手动填写 Anthropic 兼容的 BASE_URL 和 API Key"
    echo ""

    local choice
    while true; do
        read -p "选择 [1-5]: " choice
        case $choice in
            1|2|3|4|5) break ;;
            *) echo "请输入 1-5" ;;
        esac
    done

    echo ""

    case $choice in
        1)
            # Claude 官方
            write_claude_config
            ;;
        2)
            # GLM via 智谱
            local glm_model
            glm_model=$(read_glm_model | tr -d '\n')
            local api_key
            api_key=$(read_api_key "智谱开放平台" "https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys" | tr -d '\n')
            write_glm_config "glm-bigmodel" \
                "https://open.bigmodel.cn/api/anthropic" \
                "$api_key" \
                "$glm_model"
            ;;
        3)
            # GLM via Z.AI
            local glm_model
            glm_model=$(read_glm_model | tr -d '\n')
            local api_key
            api_key=$(read_api_key "Z.AI 平台" "https://z.ai/manage-apikey/apikey-list" | tr -d '\n')
            write_glm_config "glm-zai" \
                "https://api.z.ai/api/anthropic" \
                "$api_key" \
                "$glm_model"
            ;;
        4)
            # DeepSeek（按官方 Anthropic API 兼容文档配置）
            local api_key
            api_key=$(read_api_key "DeepSeek" "https://platform.deepseek.com/api_keys" | tr -d '\n')
            write_deepseek_config "$api_key"
            ;;
        5)
            # 自定义
            local base_url api_key
            echo "请输入 Anthropic 兼容的 BASE_URL:"
            read -p "  URL: " base_url
            echo ""
            api_key=$(read_api_key "自定义平台")
            write_custom_config "$base_url" "$api_key"
            ;;
    esac

    # === 第二步：MCP 工具配置 ===
    echo ""
    echo "============================================"
    echo "  MCP 工具配置（可选）"
    echo "============================================"
    echo ""

    configure_mcp_tools

    # 确保 config.env 不被提交到 git
    ensure_gitignore

    echo ""
    log_ok "配置完成！"
    echo ""
    echo "  配置文件: $CONFIG_FILE"
    echo "  使用方式: bash claude-auto-loop/run.sh \"你的需求\""
    echo "  详细需求: cp claude-auto-loop/requirements.example.md requirements.md && vim requirements.md"
    echo "  重新配置: bash claude-auto-loop/setup.sh"
    echo ""
}

# ============ 读取 API Key ============
# 用法: read_api_key "平台名称" "获取入口URL"（URL 可选）
# 注意：提示输出到 stderr，这样在 api_key=$(read_api_key ...) 时用户仍能看到
read_api_key() {
    local platform="$1"
    local api_url="${2:-}"
    echo "请输入 $platform 的 API Key:" >&2
    if [ -n "$api_url" ]; then
        echo -e "  ${BLUE}获取入口: $api_url${NC}" >&2
        echo "" >&2
    fi
    local key
    read -p "  API Key: " key
    if [ -z "$key" ]; then
        echo "API Key 不能为空" >&2
        exit 1
    fi
    echo "$key"
}

# ============ 配置写入（模块化） ============
# 参考 DeepSeek 官方文档: https://api-docs.deepseek.com/zh-cn/guides/anthropic_api

write_config_header() {
    local provider="$1"
    local desc="${2:-}"
    cat > "$CONFIG_FILE" << EOF
# Claude Auto Loop 模型配置
# 由 setup.sh 生成，请勿提交到 git（包含 API Key）
#
# 提供商: $provider
${desc:+# $desc
}
EOF
}

append_config_common() {
    local timeout_ms="${1:-3000000}"
    echo "API_TIMEOUT_MS=$timeout_ms" >> "$CONFIG_FILE"
    echo "MCP_TOOL_TIMEOUT=30000" >> "$CONFIG_FILE"
}

# --- 提供商: Claude 官方 ---
write_claude_config() {
    write_config_header "Claude 官方" "使用默认 Claude API，无需额外环境变量"
    echo "MODEL_PROVIDER=claude" >> "$CONFIG_FILE"
    append_config_common 3000000
    log_ok "已配置为 Claude 官方模型"
}

read_glm_model() {
    echo "请选择 GLM 模型版本:" >&2
    echo "" >&2
    echo "  1) GLM 4.7  - 旗舰模型，推理与代码能力强" >&2
    echo "  2) GLM 5    - 最新模型（2026），能力更强" >&2
    echo "" >&2
    local model_choice
    while true; do
        read -p "选择 [1-2，默认 1]: " model_choice
        model_choice="${model_choice:-1}"
        case $model_choice in
            1) echo "glm-4.7"; break ;;
            2) echo "glm-5"; break ;;
            *) echo "请输入 1 或 2" >&2 ;;
        esac
    done
}

# --- 提供商: GLM (智谱 / Z.AI) ---
write_glm_config() {
    local provider="${1:-glm-bigmodel}"
    local base_url="${2:-}"
    local api_key="${3:-}"
    local model="${4:-glm-4.7}"

    write_config_header "GLM ($provider)" "模型: $model"
    {
        echo "MODEL_PROVIDER=$provider"
        echo "ANTHROPIC_MODEL=$model"
        echo "ANTHROPIC_BASE_URL=$base_url"
        echo "ANTHROPIC_API_KEY=$api_key"
    } >> "$CONFIG_FILE"
    append_config_common 3000000
    log_ok "已配置为 GLM 模型 (${provider}, ${model})"
    log_info "BASE_URL: $base_url"
}

# --- 提供商: DeepSeek ---
# 参考: https://api-docs.deepseek.com/zh-cn/guides/anthropic_api
write_deepseek_config() {
    local api_key="$1"

    write_config_header "DeepSeek" "模型: deepseek-chat | API_TIMEOUT_MS=600000 防止长输出超时（10分钟）"
    {
        echo "MODEL_PROVIDER=deepseek"
        echo "ANTHROPIC_MODEL=deepseek-chat"
        echo "ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic"
        echo "ANTHROPIC_API_KEY=$api_key"
        echo "ANTHROPIC_AUTH_TOKEN=$api_key"
    } >> "$CONFIG_FILE"
    append_config_common 600000
    log_ok "已配置为 DeepSeek（Anthropic 兼容，按官方文档）"
    log_info "BASE_URL: https://api.deepseek.com/anthropic"
}

# --- 提供商: 自定义 ---
write_custom_config() {
    local base_url="$1"
    local api_key="$2"

    write_config_header "自定义"
    {
        echo "MODEL_PROVIDER=custom"
        echo "ANTHROPIC_BASE_URL=$base_url"
        echo "ANTHROPIC_API_KEY=$api_key"
    } >> "$CONFIG_FILE"
    append_config_common 3000000
    log_ok "已配置为自定义模型"
    log_info "BASE_URL: $base_url"
}

# ============ MCP 工具配置 ============
configure_mcp_tools() {
    echo "是否安装 Playwright MCP（浏览器自动化测试）？"
    echo ""
    echo "  Playwright MCP 由微软官方维护 (github.com/microsoft/playwright-mcp)"
    echo "  提供 browser_click、browser_snapshot 等 25+ 浏览器自动化工具"
    echo "  适用于有 Web 前端的项目，Agent 可用它做端到端测试"
    echo ""
    echo "  1) 是 - 安装 Playwright MCP（项目有 Web 前端）"
    echo "  2) 否 - 跳过（纯后端 / CLI 项目，不需要浏览器测试）"
    echo ""

    local mcp_choice
    while true; do
        read -p "选择 [1-2]: " mcp_choice
        case $mcp_choice in
            1|2) break ;;
            *) echo "请输入 1 或 2" ;;
        esac
    done

    if [ "$mcp_choice" = "1" ]; then
        # 将 MCP 配置追加到 config.env
        echo "" >> "$CONFIG_FILE"
        echo "# MCP 工具配置" >> "$CONFIG_FILE"
        echo "MCP_PLAYWRIGHT=true" >> "$CONFIG_FILE"

        # 尝试为 Claude CLI 安装 Playwright MCP
        if command -v claude &> /dev/null; then
            log_info "为 Claude Code CLI 安装 Playwright MCP ..."
            if claude mcp add playwright npx @playwright/mcp@latest 2>/dev/null; then
                log_ok "Playwright MCP 已添加到 Claude Code"
            else
                log_warn "自动安装失败，请手动执行:"
                log_warn "  claude mcp add playwright npx @playwright/mcp@latest"
            fi
        else
            log_info "未检测到 claude CLI，跳过自动安装"
        fi

        echo ""
        log_info "如果你使用 Cursor IDE，还需要在 Cursor 中手动添加:"
        log_info "  Cursor Settings → MCP → Add new MCP Server"
        log_info "  Name: playwright"
        log_info "  Command: npx @playwright/mcp@latest"

        log_ok "Playwright MCP 配置完成"
    else
        # 记录未启用
        echo "" >> "$CONFIG_FILE"
        echo "# MCP 工具配置" >> "$CONFIG_FILE"
        echo "MCP_PLAYWRIGHT=false" >> "$CONFIG_FILE"

        log_info "已跳过 Playwright MCP 安装"
    fi
    # 可选：调试输出（随时可改，无需重跑 setup）
    if ! grep -q "CLAUDE_DEBUG" "$CONFIG_FILE" 2>/dev/null; then
        echo "" >> "$CONFIG_FILE"
        echo "# 可选：Claude 调试（空则静默；verbose=完整输出, mcp=MCP调用）" >> "$CONFIG_FILE"
        echo "# CLAUDE_DEBUG=verbose" >> "$CONFIG_FILE"
    fi
}

# ============ 确保 .gitignore 包含 config.env ============
ensure_gitignore() {
    local gitignore="$PROJECT_ROOT/.gitignore"

    # 检查 config.env 是否已在 .gitignore 中
    if [ -f "$gitignore" ]; then
        if grep -q "claude-auto-loop/config.env" "$gitignore" 2>/dev/null; then
            return  # 已存在，无需添加
        fi
    fi

    # 追加到 .gitignore
    echo "" >> "$gitignore"
    echo "# Claude Auto Loop 模型配置（含 API Key）" >> "$gitignore"
    echo "claude-auto-loop/config.env" >> "$gitignore"
    log_info "已将 config.env 添加到 .gitignore"
}

# ============ 入口 ============
main

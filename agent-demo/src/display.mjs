/**
 * 终端显示工具：颜色、状态提示
 */

export const C = {
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
};

export function status(state) {
  const labels = {
    waiting:  `${C.green}⏳ 等待输入${C.reset}`,
    thinking: `${C.blue}🧠 思考中...${C.reset}`,
    calling:  `${C.magenta}⚡ 调用工具...${C.reset}`,
    done:     `${C.cyan}✅ 完成${C.reset}`,
    error:    `${C.yellow}❌ 错误${C.reset}`,
  };
  process.stdout.write(`\r${labels[state] || state}  \r`);
}

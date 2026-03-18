import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import FishStepCard from '../components/ui/FishStepCard';
import EnhancedCodeBlock from '../components/ui/EnhancedCodeBlock';

const QuickStart: React.FC = () => {
  return (
    <PageLayout maxWidth="narrow">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-heading-1 text-[var(--text-50)] mb-4">快速上手</h1>
        <p className="text-body text-[var(--text-400)]">只需几步，开始使用 Claude Coder</p>
      </div>

      {/* Steps */}
      <div className="space-y-8">
        {/* Step 1: 安装 */}
        <FishStepCard
          stepNumber={1}
          title="安装"
          staggerIndex={1}
          variant="default"
        >
          <EnhancedCodeBlock
            language="bash"
            title="安装依赖"
          >{`# 安装 Claude Agent SDK
npm install -g @anthropic-ai/claude-agent-sdk

# 安装 Claude Coder
npm install -g claude-coder`}</EnhancedCodeBlock>
        </FishStepCard>

        {/* Step 2: 配置 */}
        <FishStepCard
          stepNumber={2}
          title="配置"
          staggerIndex={2}
          variant="default"
        >
          <EnhancedCodeBlock
            language="bash"
            title="配置环境"
          >{`# 交互式配置（模型、MCP、安全限制）
claude-coder setup

# 或手动配置环境变量
echo "ANTHROPIC_DEFAULT_OPUS_MODEL=glm-5" >> .env`}</EnhancedCodeBlock>
        </FishStepCard>

        {/* Step 3: 初始化项目 */}
        <FishStepCard
          stepNumber={3}
          title="初始化项目"
          staggerIndex={3}
          variant="default"
        >
          <EnhancedCodeBlock
            language="bash"
            title="初始化"
          >{`cd your-project
claude-coder init`}</EnhancedCodeBlock>
        </FishStepCard>

        {/* Step 4: 开始编码 */}
        <FishStepCard
          stepNumber={4}
          title="开始编码"
          staggerIndex={4}
          variant="default"
        >
          <EnhancedCodeBlock
            language="bash"
            title="运行命令"
          >{`# 方式一：直接输入需求
claude-coder run "实现用户注册和登录功能"

# 方式二：从需求文件读取
claude-coder run

# 方式三：交互模式
claude-coder plan -i "需求描述"`}</EnhancedCodeBlock>

          <div className="mt-6">
            <h4 className="text-heading-3 text-[var(--text-50)] mb-3">常用选项</h4>
            <ul className="space-y-2 text-[var(--text-400)]">
              <li className="flex items-start gap-2">
                <code className="px-2 py-0.5 bg-[var(--bg-100)] rounded text-[var(--lazy-cyan)] text-sm">--max N</code>
                <span className="text-body">限制 session 数（默认 50）</span>
              </li>
              <li className="flex items-start gap-2">
                <code className="px-2 py-0.5 bg-[var(--bg-100)] rounded text-[var(--lazy-cyan)] text-sm">--pause N</code>
                <span className="text-body">每 N 个 session 暂停确认</span>
              </li>
              <li className="flex items-start gap-2">
                <code className="px-2 py-0.5 bg-[var(--bg-100)] rounded text-[var(--lazy-cyan)] text-sm">--dry-run</code>
                <span className="text-body">预览模式（查看任务队列）</span>
              </li>
              <li className="flex items-start gap-2">
                <code className="px-2 py-0.5 bg-[var(--bg-100)] rounded text-[var(--lazy-cyan)] text-sm">--model M</code>
                <span className="text-body">指定模型</span>
              </li>
            </ul>
          </div>
        </FishStepCard>

        {/* Verification */}
        <FishStepCard
          stepNumber={5}
          title="验证安装"
          staggerIndex={5}
          variant="success"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        >
          <EnhancedCodeBlock
            language="bash"
            title="验证"
          >{`claude-coder status
# 应显示配置信息和模型状态`}</EnhancedCodeBlock>
        </FishStepCard>
      </div>
    </PageLayout>
  );
};

export default QuickStart;
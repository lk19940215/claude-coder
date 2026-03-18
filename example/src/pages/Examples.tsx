import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import SectionCard from '../components/ui/SectionCard';

interface Example {
  id: string;
  title: string;
  description: string;
  command: string;
  result: string;
  repo?: string;
}

const examples: Example[] = [
  {
    id: '1',
    title: 'Todo 应用',
    description: '用 Express + React 快速搭建 Todo 应用。',
    command: 'claude-coder run "用 Express + React 做 Todo 应用"',
    result: '自动生成前后端代码结构',
  },
  {
    id: '2',
    title: '头像上传功能',
    description: '为现有项目新增头像上传功能。',
    command: 'claude-coder run "新增头像上传功能"',
    result: '自动检测项目技术栈并生成对应代码',
  },
  {
    id: '3',
    title: '需求文档驱动',
    description: '从 requirements.md 自动生成任务队列。',
    command: `claude-coder run
claude-coder add -r  # 同步新任务`,
    result: '支持复杂需求的分阶段实现',
  },
  {
    id: '4',
    title: '自动测试',
    description: '导出浏览器登录态用于自动化测试。',
    command: 'claude-coder auth http://localhost:3000',
    result: '自动生成测试凭证文件',
  },
  {
    id: '5',
    title: 'AI 教学 PPT 生成器',
    description: '用 AI 快速生成精美教学 PPT，支持 Markdown 转幻灯片。',
    command: 'claude-coder run "生成 AI 教学 PPT 项目"',
    result: '自动创建 React + TypeScript 项目结构',
    repo: 'https://github.com/lk19940215/ai-teaching-ppt',
  },
];

// Stagger animation classes for cards
const STAGGER_CLASSES = [
  'animate-stagger-1',
  'animate-stagger-2',
  'animate-stagger-3',
  'animate-stagger-4',
  'animate-stagger-5',
];

const Examples: React.FC = () => {
  return (
    <PageLayout maxWidth="default">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-display text-[var(--text-50)] mb-4">使用案例</h1>
        <p className="text-body max-w-2xl">
          探索 Claude Coder 在实际项目中的应用，了解如何让 AI Agent 为你连续编码
        </p>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-grid">
        {examples.map((example, index) => (
          <SectionCard
            key={example.id}
            variant="bordered"
            hover
            className={`${STAGGER_CLASSES[index % STAGGER_CLASSES.length]} flex flex-col h-full`}
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="step-number">{example.id}</div>
              <h2 className="text-heading-2 text-[var(--text-50)]">{example.title}</h2>
            </div>

            {/* Description */}
            <p className="text-body mb-4">{example.description}</p>

            {/* Command Block */}
            <div className="code-block-responsive mb-4 flex-grow">
              <pre className="text-[var(--text-200)] whitespace-pre-wrap">{example.command}</pre>
            </div>

            {/* Result */}
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-[var(--success-500)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-caption">{example.result}</span>
            </div>

            {/* GitHub Repo Link */}
            {example.repo && (
              <a
                href={example.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-200)] hover:bg-[var(--primary-600)] rounded-lg text-[var(--text-200)] hover:text-white transition-all duration-300 group"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="link-underline">查看仓库</span>
              </a>
            )}
          </SectionCard>
        ))}
      </div>
    </PageLayout>
  );
};

export default Examples;
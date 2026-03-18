import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import SectionCard from '../components/ui/SectionCard';
import { GitHubIcon, CheckIcon } from '../components/ui/Icons';

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
              <CheckIcon className="w-4 h-4 text-[var(--success-500)]" />
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
                <GitHubIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
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
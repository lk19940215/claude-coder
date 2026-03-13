import React from 'react';

const examples = [
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
];

const Examples: React.FC = () => {
  return (
    <div className="min-h-screen">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-[var(--text-50)] mb-4">使用案例</h1>
          <p className="text-lg text-[var(--text-400)] mb-12">探索 Claude Coder 在实际项目中的应用</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {examples.map((example) => (
              <div key={example.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary-600)] flex items-center justify-center text-white font-bold">
                    {example.id}
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-50)]">{example.title}</h2>
                </div>
                <p className="text-[var(--text-400)] mb-4">{example.description}</p>
                <div className="code-block mb-4">
                  <pre className="text-[var(--text-200)]">{example.command}</pre>
                </div>
                <p className="text-sm text-[var(--text-400)]">✓ {example.result}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Examples;

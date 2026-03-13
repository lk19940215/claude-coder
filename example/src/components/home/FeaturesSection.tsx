import React from 'react';

const features = [
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    title: '一句话需求',
    description: '自然语言描述需求，自动分解为可执行任务队列。',
  },
  {
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    title: '长时间自运行',
    description: 'Session 守护机制，自动处理中断和恢复，支持多 Session 连续执行。',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    title: '安全可控',
    description: 'Hook 注入机制、代码审查、沙箱执行，确保生成代码安全可靠。',
  },
  {
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    title: '多模型支持',
    description: '支持 Claude、DeepSeek、Coding Plan 等任意模型，灵活切换。',
  },
  {
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    title: '测试凭证管理',
    description: 'Playwright 登录态导出、API Key 持久化，端到端测试自动化。',
  },
  {
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    title: '灵活配置',
    description: 'JSON 配置文件、环境变量、命令行参数，多种方式满足不同场景。',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-50)] mb-4">
            核心特性
          </h2>
          <p className="text-lg text-[var(--text-400)] max-w-2xl mx-auto">
            让 AI 成为真正的编码伙伴，从需求到交付，全程自主执行
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary-500)] to-[var(--gradient-start)] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={feature.icon}
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-50)] mb-2">
                {feature.title}
              </h3>
              <p className="text-[var(--text-400)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GITHUB_REPO_URL } from '../../utils';
import { GitHubIcon } from '../ui/Icons';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  duration: number;
  size: number;
  color: string;
}

const HEART_COLORS = [
  '#ec4899', '#f472b6', '#fb7185', '#f43f5e',
  '#e879f9', '#c084fc', '#a78bfa',
];

const HeroSection: React.FC = () => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const heartsRef = useRef<HeartParticle[]>([]);
  const [hearts, setHearts] = React.useState<HeartParticle[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnHeart = useCallback(() => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    const parentRect = titleRef.current.offsetParent?.getBoundingClientRect();
    if (!parentRect) return;

    const relX = rect.left - parentRect.left;
    const relY = rect.top - parentRect.top;

    const side = Math.random();
    let x: number, y: number;
    if (side < 0.25) {
      x = relX + Math.random() * rect.width;
      y = relY - 5;
    } else if (side < 0.5) {
      x = relX + Math.random() * rect.width;
      y = relY + rect.height + 5;
    } else if (side < 0.75) {
      x = relX - 5;
      y = relY + Math.random() * rect.height;
    } else {
      x = relX + rect.width + 5;
      y = relY + Math.random() * rect.height;
    }

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60;

    const heart: HeartParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 20,
      duration: 1.5 + Math.random() * 1.5,
      size: 10 + Math.random() * 8,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    };

    heartsRef.current = [...heartsRef.current.slice(-15), heart];
    setHearts([...heartsRef.current]);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(spawnHeart, 600);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [spawnHeart]);

  const handleHeartEnd = useCallback((id: number) => {
    heartsRef.current = heartsRef.current.filter(h => h.id !== id);
    setHearts([...heartsRef.current]);
  }, []);

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center relative">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-50)] mb-6 animate-title-float">
          <span
            ref={titleRef}
            className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text text-transparent"
          >
            Claude Coder
          </span>
        </h1>

        {hearts.map(h => (
          <span
            key={h.id}
            className="heart-particle"
            style={{
              left: h.x,
              top: h.y,
              '--heart-dx': `${h.dx}px`,
              '--heart-dy': `${h.dy}px`,
              '--heart-duration': `${h.duration}s`,
              '--heart-size': `${h.size}px`,
              '--heart-color': h.color,
            } as React.CSSProperties}
            onAnimationEnd={() => handleHeartEnd(h.id)}
          >
            &#x2764;
          </span>
        ))}

        <p className="text-xl sm:text-2xl text-[var(--lazy-cyan)] mb-8 max-w-3xl mx-auto font-semibold text-glow animate-wave">
          摸鱼神器 🐟
        </p>

        <p className="text-lg text-[var(--text-300)] mb-12 max-w-2xl mx-auto animate-wave-slow leading-relaxed">
          AI 加班你摸鱼，Claude Coder 帮你搞定一切。
          <br />
          一句话需求 → 完整项目。长时间自运行，自动分解任务、持续编码、验证交付。
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/quick-start" className="btn-primary animate-pulse-glow text-base no-underline">
            开始使用
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-[var(--text-400)] hover:text-[var(--text-50)] transition-colors group"
          >
            <GitHubIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
            <span className="link-underline">View on GitHub</span>
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--text-50)]">50+</div>
            <div className="text-[var(--text-400)] text-sm">Sessions 自动运行</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--text-50)]">∞</div>
            <div className="text-[var(--text-400)] text-sm">模型支持</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--text-50)]">0</div>
            <div className="text-[var(--text-400)] text-sm">配置即开即用</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

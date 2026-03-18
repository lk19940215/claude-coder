import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
}

type ParticleType = 'circle' | 'heart';

interface ParticleContainerProps {
  children: React.ReactNode;
  particleCount?: number;
  colors?: string[];
  autoTrigger?: boolean;
  triggerDelay?: number;
  className?: string;
  particleType?: ParticleType;
  particleSize?: number;
}

// 爱心形状 SVG
const HeartShape: React.FC<{ color: string; size: number; opacity: number }> = ({
  color,
  size,
  opacity,
}) => (
  <svg
    viewBox="0 0 24 24"
    style={{
      width: size,
      height: size,
      opacity,
      filter: `drop-shadow(0 0 ${size / 4}px ${color})`,
    }}
    fill={color}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const ParticleContainer: React.FC<ParticleContainerProps> = ({
  children,
  particleCount = 18,
  colors = ['var(--fish-gold)', 'var(--lazy-cyan)'],
  autoTrigger = false,
  triggerDelay = 0,
  className = '',
  particleType = 'circle',
  particleSize = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const hasAutoTriggered = useRef(false);

  // 生成粒子
  const generateParticles = useCallback(
    (centerX: number, centerY: number) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const baseSize = (4 + Math.random() * 6) * particleSize;
        newParticles.push({
          id: Date.now() + i,
          x: centerX,
          y: centerY,
          color: colors[i % colors.length],
          angle: (Math.PI * 2 * i) / particleCount + Math.random() * 0.5,
          speed: 2 + Math.random() * 3,
          size: baseSize,
          opacity: 1,
        });
      }
      return newParticles;
    },
    [particleCount, colors, particleSize]
  );

  // 触发粒子动画
  const triggerParticles = useCallback(() => {
    if (isAnimating || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setParticles(generateParticles(centerX, centerY));
    setIsAnimating(true);
  }, [isAnimating, generateParticles]);

  // 动画循环
  useEffect(() => {
    if (!isAnimating || particles.length === 0) return;

    let frameCount = 0;
    const maxFrames = 60;

    const animate = () => {
      frameCount++;

      setParticles(prevParticles =>
        prevParticles.map(p => ({
          ...p,
          x: p.x + Math.cos(p.angle) * p.speed,
          y: p.y + Math.sin(p.angle) * p.speed,
          opacity: Math.max(0, 1 - frameCount / maxFrames),
          size: p.size * 0.98,
        }))
      );

      if (frameCount < maxFrames) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setParticles([]);
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, particles.length]);

  // IntersectionObserver 检测视口
  useEffect(() => {
    if (!autoTrigger || !containerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAutoTriggered.current) {
            hasAutoTriggered.current = true;
            setTimeout(() => {
              triggerParticles();
            }, triggerDelay);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [autoTrigger, triggerDelay, triggerParticles]);

  // 渲染单个粒子
  const renderParticle = (particle: Particle) => {
    const commonStyle = {
      position: 'absolute' as const,
      left: particle.x,
      top: particle.y,
      pointerEvents: 'none' as const,
      transform: 'translate(-50%, -50%)',
    };

    if (particleType === 'heart') {
      return (
        <div key={particle.id} style={commonStyle}>
          <HeartShape
            color={particle.color}
            size={particle.size}
            opacity={particle.opacity}
          />
        </div>
      );
    }

    return (
      <div
        key={particle.id}
        className="particle particle-fly"
        style={{
          ...commonStyle,
          width: particle.size,
          height: particle.size,
          borderRadius: '50%',
          backgroundColor: particle.color,
          opacity: particle.opacity,
          boxShadow: `0 0 ${particle.size}px ${particle.color}`,
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={`particle-container relative inline-block ${className}`}
      onClick={triggerParticles}
    >
      {children}
      {particles.map(renderParticle)}
    </div>
  );
};

export default memo(ParticleContainer);
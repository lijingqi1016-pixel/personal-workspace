import { useState, useEffect, useRef } from 'react';

// 密码用简单哈希存储，不明文写在代码里
// 202604 的 hash
const PASS_HASH = btoa('202604' + ':pw-salt-2026');

function verify(input: string) {
  return btoa(input + ':pw-salt-2026') === PASS_HASH;
}

const SESSION_KEY = 'pw_unlocked';

interface Props {
  children: React.ReactNode;
}

export default function LockScreen({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [digits, setDigits] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 检查本次会话是否已解锁
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setUnlocked(true);
    }
  }, []);

  // 输入满6位后自动验证
  useEffect(() => {
    if (digits.length === 6) {
      const input = digits.join('');
      if (verify(input)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setUnlocked(true);
      } else {
        setShake(true);
        setHint('密码错误，请重试');
        setTimeout(() => {
          setShake(false);
          setDigits([]);
          setHint('');
        }, 600);
      }
    }
  }, [digits]);

  const handleDigit = (d: string) => {
    if (digits.length < 6) setDigits((prev) => [...prev, d]);
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setHint('');
  };

  if (unlocked) return <>{children}</>;

  const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(245,245,247,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
        fontFamily: '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 图标 */}
      <div style={{ fontSize: 48, marginBottom: 16, userSelect: 'none' }}>🔒</div>

      {/* 标题 */}
      <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1C1C1E', margin: 0, marginBottom: 6 }}>
        个人工作台
      </h1>
      <p style={{ fontSize: 13, color: '#8E8E93', margin: 0, marginBottom: 32 }}>
        请输入访问密码
      </p>

      {/* 圆点指示 */}
      <div
        ref={containerRef}
        style={{
          display: 'flex', gap: 14, marginBottom: 12,
          animation: shake ? 'lockShake 0.5s ease' : 'none',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid #C7C7CC',
              background: i < digits.length ? '#1C1C1E' : 'transparent',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>

      {/* 错误提示 */}
      <p style={{
        fontSize: 12, color: '#FF3B30', height: 18, margin: 0, marginBottom: 20,
        opacity: hint ? 1 : 0, transition: 'opacity 0.2s',
      }}>
        {hint}
      </p>

      {/* 数字键盘 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12 }}>
        {KEYS.flat().map((key, i) => {
          if (key === '') return <div key={i} />;
          return (
            <button
              key={i}
              onClick={() => key === '⌫' ? handleDelete() : handleDigit(key)}
              style={{
                width: 72, height: 72, borderRadius: '50%', border: 'none',
                cursor: 'pointer',
                background: key === '⌫' ? 'transparent' : 'rgba(255,255,255,0.8)',
                boxShadow: key === '⌫' ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: key === '⌫' ? 22 : 26,
                fontWeight: key === '⌫' ? 400 : 300,
                color: '#1C1C1E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.1s, transform 0.08s',
                userSelect: 'none',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.93)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

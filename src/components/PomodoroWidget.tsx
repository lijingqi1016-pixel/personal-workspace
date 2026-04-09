import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

type Phase = 'work' | 'break';

// ─── 用 AudioContext 合成提示音（不依赖任何外部文件）───
function playBeep(frequency = 880, duration = 0.6, volume = 0.4) {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    // 连续两声
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 1.2, ctx.currentTime + duration + 0.1);
    gain2.gain.setValueAtTime(volume, ctx.currentTime + duration + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 2 + 0.1);
    osc2.start(ctx.currentTime + duration + 0.1);
    osc2.stop(ctx.currentTime + duration * 2 + 0.1);
    setTimeout(() => ctx.close(), 3000);
  } catch (_) { /* 浏览器不支持时静默失败 */ }
}

// ─── 系统通知（权限已授予才发，否则只依赖声音+视觉）───
function tryNotification(msg: string) {
  if (Notification.permission === 'granted') {
    try {
      new Notification('🍅 番茄工作钟', { body: msg, icon: '/favicon.svg', requireInteraction: false });
    } catch (_) { /* 部分浏览器在 localhost 下会失败，静默跳过 */ }
  }
}

export default function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('work');
  const [flash, setFlash] = useState(false);          // 视觉闪烁提示
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ref 保存最新 phase，避免 setInterval 闭包陈旧
  const phaseRef = useRef<Phase>('work');
  phaseRef.current = phase;

  // ── 页面加载时主动请求通知权限 ──
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── 标签页标题同步 ──
  useEffect(() => {
    const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const ss = String(timeLeft % 60).padStart(2, '0');
    document.title = running ? `${mm}:${ss} · 个人工作台` : '个人工作台';
    return () => { document.title = '个人工作台'; };
  }, [timeLeft, running]);

  // ── 阶段切换（声音 + 通知 + 视觉闪烁三重保障）──
  const switchPhase = useCallback(() => {
    const cur = phaseRef.current;
    // 1. 声音提示
    playBeep(cur === 'work' ? 880 : 660);
    // 2. 系统通知
    tryNotification(cur === 'work' ? '专注时间结束！休息 5 分钟吧 ☕' : '休息结束，继续专注！💪');
    // 3. 视觉闪烁（卡片边框高亮 2 秒）
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
    // 4. 切换状态
    if (cur === 'work') {
      phaseRef.current = 'break';
      setPhase('break');
      setTimeLeft(BREAK_TIME);
    } else {
      phaseRef.current = 'work';
      setPhase('work');
      setTimeLeft(WORK_TIME);
    }
    setRunning(false);
  }, []);

  // ── 计时器 ──
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setTimeout(switchPhase, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = () => {
    setRunning(false);
    phaseRef.current = 'work';
    setPhase('work');
    setTimeLeft(WORK_TIME);
    setFlash(false);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const total = phase === 'work' ? WORK_TIME : BREAK_TIME;
  const progress = (total - timeLeft) / total;
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const accentColor = phase === 'work' ? '#007AFF' : '#34C759';

  return (
    <div
      className="card flex flex-col items-center justify-between h-full"
      style={{
        minHeight: 380,
        transition: 'box-shadow 0.3s, border-color 0.3s',
        // 视觉闪烁：边框高亮
        boxShadow: flash
          ? `0 0 0 3px ${accentColor}, 0 8px 32px rgba(0,0,0,0.08)`
          : undefined,
        outline: flash ? `2px solid ${accentColor}` : 'none',
      }}
    >
      {/* 标题 */}
      <div className="w-full flex items-center justify-between">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>番茄工作钟</h2>
        <span
          style={{
            fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 8,
            background: phase === 'work' ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)',
            color: phase === 'work' ? '#FF3B30' : '#34C759',
          }}
        >
          {phase === 'work' ? '专注' : '休息'}
        </span>
      </div>

      {/* 进度环 + 数字 */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
        <svg width={168} height={168} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={84} cy={84} r={radius} fill="none" stroke="#F2F2F7" strokeWidth={4} />
          <circle
            cx={84} cy={84} r={radius} fill="none"
            stroke={accentColor}
            strokeWidth={4} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: '"SF Pro Display", -apple-system, sans-serif',
              fontSize: 46, fontWeight: 200, color: '#1C1C1E',
              letterSpacing: '-1px', lineHeight: 1,
            }}
          >
            {mm}:{ss}
          </div>
        </div>
      </div>

      {/* 状态文案 */}
      <p style={{ fontSize: 12, color: '#8E8E93', marginBottom: 4 }}>
        {running
          ? phase === 'work' ? '专注工作中…' : '休息一下吧 ☕'
          : timeLeft === total ? '准备开始' : '已暂停'}
      </p>

      {/* 控制按钮 */}
      <div className="flex items-center gap-4">
        <IconBtn onClick={reset} title="重置">
          <RotateCcw size={17} />
        </IconBtn>
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: accentColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${phase === 'work' ? 'rgba(0,122,255,0.35)' : 'rgba(52,199,89,0.35)'}`,
            transition: 'all 0.2s',
          }}
        >
          {running ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
        </button>
        <IconBtn onClick={switchPhase} title={phase === 'work' ? '切到休息' : '切到专注'}>
          <span style={{ fontSize: 14 }}>{phase === 'work' ? '☕' : '🍅'}</span>
        </IconBtn>
      </div>

      {/* 提示 */}
      <p style={{ fontSize: 10, color: '#C7C7CC', marginTop: 8 }}>
        工作 25 分钟 · 休息 5 分钟
      </p>

      {/* 通知权限状态提示 */}
      {'Notification' in window && Notification.permission === 'denied' && (
        <p style={{ fontSize: 10, color: '#FF9500', marginTop: 4, textAlign: 'center' }}>
          ⚠️ 浏览器通知已被屏蔽，请在地址栏设置中开启
        </p>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'transparent', color: '#8E8E93',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}
      className="hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
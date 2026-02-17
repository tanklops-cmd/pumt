import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [quirkyMessage, setQuirkyMessage] = useState(0);

  const messages = [
    "Warming up the cells...",
    "Counting prisoners...",
    "Calibrating security...",
    "Loading muster data...",
    "Checking cell alarms...",
    "Preparing handover...",
    "Syncing with servers...",
    "Almost ready...",
  ];

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setPhase('hold'), 800);
    
    // Quirky messages cycling
    const messageInterval = setInterval(() => {
      setQuirkyMessage(prev => (prev + 1) % messages.length);
    }, 600);

    // Exit animation
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(onComplete, 600);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearInterval(messageInterval);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-all duration-500 ${
        phase === 'enter' ? 'opacity-0 scale-110' : phase === 'exit' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Quirky animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-corrections-blue/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random()}s`,
            }}
          />
        ))}
      </div>

      {/* Logo container with quirky animation */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with bounce effect */}
        <div className={`transition-transform duration-700 ${phase === 'hold' ? 'animate-bounce' : ''}`}>
          <img
            src="/corrections-logo-large.png"
            alt="Ara Poutama Aotearoa - Department of Corrections"
            className="w-64 h-64 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Title with typing effect */}
        <h1 className="mt-6 text-3xl font-bold text-white tracking-wider">
          <span className="inline-block animate-pulse">P</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.1s' }}>U</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>M</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.3s' }}>T</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-corrections-blue-light text-lg font-medium">
          Prison Unit Muster Tracking
        </p>

        {/* Quirky loading message */}
        <div className="mt-8 h-8">
          <p className="text-slate-400 text-sm animate-fade-in-out">
            {messages[quirkyMessage]}
          </p>
        </div>

        {/* Progress bar with quirky animation */}
        <div className="mt-6 w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-corrections-blue to-blue-400 rounded-full transition-all duration-300"
            style={{
              width: phase === 'enter' ? '0%' : phase === 'exit' ? '100%' : '60%',
            }}
          />
        </div>

        {/* Footer text */}
        <p className="mt-8 text-slate-500 text-xs">
          Ara Poutama Aotearoa • Department of Corrections
        </p>
      </div>

      {/* CSS for additional animations */}
      <style>{`
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-fade-in-out {
          animation: fade-in-out 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface KineticDotsLoaderProps {
  className?: string;
  dots?: number;
}

export default function KineticDotsLoader({ className, dots = 4 }: KineticDotsLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className='flex gap-5'>
        {[...Array(dots)].map((_, i) => (
          <div
            key={i}
            className='relative flex flex-col items-center justify-end h-20 w-6'
          >
            {/* Bouncing dot */}
            <div
              className='relative w-5 h-5 z-10'
              style={{
                animation: 'kd-gravity-bounce 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                animationDelay: `${i * 0.15}s`,
                willChange: 'transform',
              }}
            >
              <div
                className='w-full h-full rounded-full bg-gradient-to-b from-cyan-300 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                style={{
                  animation: 'kd-rubber-morph 1.4s linear infinite',
                  animationDelay: `${i * 0.15}s`,
                  willChange: 'transform',
                }}
              />
              <div className='absolute top-1 left-1 w-1.5 h-1.5 bg-white/60 rounded-full blur-[0.5px]' />
            </div>

            {/* Floor ripple */}
            <div
              className='absolute bottom-0 w-10 h-3 border border-cyan-500/30 rounded-[100%] opacity-0'
              style={{
                animation: 'kd-ripple-expand 1.4s linear infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />

            {/* Reflective shadow */}
            <div
              className='absolute -bottom-1 w-5 h-1.5 rounded-[100%] bg-cyan-500/40 blur-sm'
              style={{
                animation: 'kd-shadow-breathe 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes kd-gravity-bounce {
          0%   { transform: translateY(0);     animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1); }
          50%  { transform: translateY(-40px); animation-timing-function: cubic-bezier(0.32, 0, 0.67, 0); }
          100% { transform: translateY(0); }
        }
        @keyframes kd-rubber-morph {
          0%   { transform: scale(1.4, 0.6); }
          5%   { transform: scale(0.9, 1.1); }
          15%  { transform: scale(1, 1); }
          50%  { transform: scale(1, 1); }
          85%  { transform: scale(0.9, 1.1); }
          100% { transform: scale(1.4, 0.6); }
        }
        @keyframes kd-shadow-breathe {
          0%   { transform: scale(1.4); opacity: 0.6; }
          50%  { transform: scale(0.5); opacity: 0.1; }
          100% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes kd-ripple-expand {
          0%   { transform: scale(0.5); opacity: 0;   border-width: 4px; }
          5%   { opacity: 0.8; }
          30%  { transform: scale(1.5); opacity: 0;   border-width: 0px; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

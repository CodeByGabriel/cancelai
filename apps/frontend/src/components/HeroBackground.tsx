'use client';

export function HeroBackground() {
  return (
    <>
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 right-1/4 w-[400px] h-[300px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none"
        style={{ opacity: 0.07, background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        aria-hidden="true"
      />
    </>
  );
}

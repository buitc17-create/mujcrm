'use client';

export default function AnnouncementBar() {
  return (
    <div
      className="w-full text-center py-2.5 px-4 text-sm font-medium"
      style={{
        background: 'linear-gradient(90deg, #7B2FFF22, #00BFFF22)',
        borderBottom: '1px solid rgba(0,191,255,0.15)',
      }}
    >
      <span>🎁 7 dní Medium zdarma — vyzkoušej všechny funkce bez platební karty</span>
      <span className="mx-3 opacity-40">|</span>
      <a
        href="/onboarding"
        className="font-semibold underline underline-offset-2"
        style={{ color: '#00BFFF' }}
      >
        Začít zdarma
      </a>
    </div>
  );
}

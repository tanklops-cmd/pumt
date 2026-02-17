export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
      {/* Large centered watermark logo, low opacity */}
      <img
        src="/corrections-logo-large.png"
        alt="Ara Poutama Aotearoa watermark"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vw',
          maxWidth: 800,
          minWidth: 320,
          opacity: 0.13,
          pointerEvents: 'none',
          zIndex: 10,
          userSelect: 'none',
        }}
        aria-hidden="true"
      />
    </div>
  )
}

export default function PausePage() {
  return (
    <div className="min-h-screen px-6 flex items-center justify-center">
      <div className="card w-full max-w-2xl p-8 md:p-10 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Project on Pause
        </h1>

        <p className="mt-4 text-lg md:text-xl italic leading-relaxed">
          “The two most powerful warriors are patience and time.”
        </p>

        <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          — Leo Tolstoy
        </p>
      </div>
    </div>
  )
}

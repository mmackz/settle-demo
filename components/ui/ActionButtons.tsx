'use client';

export function ActionButtons() {
  return (
    <div className="flex justify-center gap-2 px-4 py-4">
      {/* Settle */}
      <button className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 transition-colors hover:bg-zinc-800">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
        <span className="text-xs font-bold text-white">Settle</span>
      </button>

      {/* Request */}
      <button className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 transition-colors hover:bg-zinc-800">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M17 7L7 17M7 17H17M7 17V7"/>
        </svg>
        <span className="text-xs font-bold text-white">Request</span>
      </button>

      {/* Deposit */}
      <button className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 transition-colors hover:bg-zinc-800">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 5V19M12 19L5 12M12 19L19 12"/>
        </svg>
        <span className="text-xs font-bold text-white">Deposit</span>
      </button>

      {/* QR */}
      <button className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 transition-colors hover:bg-zinc-800">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm11-2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm2 0h2v2h-2v-2zm0-4h2v2h-2v-2zm2 2h2v2h-2v-2z"/>
        </svg>
        <span className="text-xs font-bold text-white">QR</span>
      </button>
    </div>
  );
}

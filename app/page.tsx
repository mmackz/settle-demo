'use client';

import dynamic from "next/dynamic";

const App = dynamic(() => import("@/components/App").then((m) => m.App), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
    </div>
  ),
});

export default function Page() {
  return <App />;
}

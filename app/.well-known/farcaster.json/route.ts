import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://settle-demo.vercel.app';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: 'eyJmaWQiOjEyMzQ1LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4Li4uIn0',
      payload: 'eyJkb21haW4iOiJzZXR0bGUtZGVtby52ZXJjZWwuYXBwIn0',
      signature: '0x...',
    },
    frame: {
      version: '1',
      name: 'Settle Demo',
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#000000',
      subtitle: 'Earn cashback at local merchants',
    },
  };

  return NextResponse.json(manifest);
}

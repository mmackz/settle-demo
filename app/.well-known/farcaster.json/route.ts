import { NextResponse } from 'next/server';

const APP_URL = 'https://settle-demo-black.vercel.app';

export async function GET() {
  const manifest = {
    accountAssociation: {},
    frame: {
      version: '1',
      name: 'Settle Boost Demo',
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      splashImageUrl: `${APP_URL}/icon.png`,
      splashBackgroundColor: '#000000',
      subtitle: 'Earn cashback at local merchants',
    },
  };

  return NextResponse.json(manifest);
}

import { NextResponse } from 'next/server';

const APP_URL = 'https://settle-demo-black.vercel.app';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: 'eyJmaWQiOjIyODU5NywidHlwZSI6ImF1dGgiLCJrZXkiOiIweGE3QzY2OWMzNjY1NjlCNjczMTQ0RkQ1OTM2OTRlMkM2ZDE3ZDA4N0QifQ',
      payload: 'eyJkb21haW4iOiJzZXR0bGUtZGVtby1ibGFjay52ZXJjZWwuYXBwIn0',
      signature: 'ZOjTpYAzsxRvhr9RHw8ko1LQq7D3DMgVd2kkveGzXP4fZ4E8/flwxv1OnqSF7yWasXdPWMvX/J/5e3INrEf4IBw='
    },
    frame: {
      version: '1',
      name: 'Settle Boost Demo',
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      splashImageUrl: `${APP_URL}/icon.png`,
      splashBackgroundColor: '#000000',
      subtitle: 'Earn cashback',
    },
  };

  return NextResponse.json(manifest);
}

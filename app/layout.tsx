import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/lib/wagmi";
import { WagmiProvider } from "@/components/providers/WagmiProvider";
import { BoostProvider } from "@/components/providers/BoostProvider";
import { FarcasterProvider } from "@/components/providers/FarcasterProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://settle-demo.vercel.app";

const frameMetadata = {
  version: "next",
  imageUrl: `${APP_URL}/icon.png`,
  button: {
    title: "View Rewards",
    action: {
      type: "launch_frame",
      name: "Settle Demo",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/icon.png`,
      splashBackgroundColor: "#000000",
    },
  },
};

export const metadata: Metadata = {
  title: "Settle Demo",
  description: "Earn cashback rewards at local merchants",
  openGraph: {
    title: "Settle Demo",
    description: "Earn cashback rewards at local merchants",
    images: [`${APP_URL}/icon.png`],
  },
  other: {
    "fc:frame": JSON.stringify(frameMetadata),
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");
  const initialState = cookieToInitialState(config, cookies ?? undefined);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WagmiProvider initialState={initialState}>
          <BoostProvider>
            <FarcasterProvider>
              {children}
            </FarcasterProvider>
          </BoostProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

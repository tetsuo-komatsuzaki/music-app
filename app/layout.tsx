import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HapticProvider from "./components/HapticProvider";
import NativeChrome from "./components/NativeChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// viewportFit: "cover" はアプリ殻(ノッチ端末)で env(safe-area-inset-*) を有効にするため必須。
// 通常のブラウザ表示では safe-area は 0 になるだけで無害 (ARC-SPEC-NATIVE-1.0)。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Arcoda｜きみの音を、きみの曲に。",
    template: "%s | Arcoda",
  },
  description:
    "いつか弾きたいあの曲へ。AIの先生アルコと、バイオリンの上達をいっしょに。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NativeChrome />
        <HapticProvider />
        {children}
      </body>
    </html>
  );
}

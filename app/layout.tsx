import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import HapticProvider from "./components/HapticProvider";
import NativeChrome from "./components/NativeChrome";
import ArcoBootSplash from "./components/ArcoBootSplash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// モックの書体 (uiv2/app.css --sans)。ダーク全面刷新でアプリ本文もこれに統一
const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700", "900"],
  // 日本語はプリロード対象外のため subsets 指定なし + preload:false で
  // 全スライスを unicode-range 配信にする (これで漢字かなが Zen Kaku になる)
  preload: false,
  display: "swap",
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
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${zenKaku.variable} antialiased`}
      >
        {/* アプリ殻では起動直後(ハイドレーション前)から data-native-app を立てる。
            Capacitorブリッジは document start で注入済みなので同期判定できる。
            これで起動スプラッシュ(#arco-boot)とステータスバー帯が最初の描画から効く。 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var c=window.Capacitor;if(c&&typeof c.isNativePlatform==="function"&&c.isNativePlatform()){document.documentElement.setAttribute("data-native-app","true")}}catch(e){}',
          }}
        />
        <ArcoBootSplash />
        <NativeChrome />
        <HapticProvider />
        {children}
      </body>
    </html>
  );
}

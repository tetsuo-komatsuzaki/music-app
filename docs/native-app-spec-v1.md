# ARC-SPEC-NATIVE-1.0 アプリ版（iOS先行）設計書

作成: 2026-08-14 / 状態: レビュー中（実装未着手）

## 0. 目的

ブラウザ録音の構造的限界（OSの音声加工を確実にオフにできない・非可逆圧縮）を、
録音入口のネイティブ化で解消する。**アプリ化の価値の本体は録音品質**。
Web版とアプリ版は単一コードベースで並行運用し、二重メンテを発生させない。

## 1. 全体構成

```
music-app/music-app
├─ app/            # UI・ロジック（Web/アプリ共通・変更は最小限）
├─ music-analyzer/ # 解析サーバー（FLAC対応1行のみ）
└─ native/         # 新規: アプリの殻
    ├─ capacitor.config.ts   # server.url = https://arcodaviolin.com (remote URL方式)
    ├─ ios/                  # Capacitor生成のXcodeプロジェクト
    └─ plugins/arcoda-recorder/  # 自作ネイティブ録音プラグイン (Swift)
```

- **remote URL方式**: アプリはarcodaviolin.comを表示する殻。UI更新はVercelデプロイだけで
  Web/アプリ同時反映。審査再提出は殻・プラグイン変更時のみ。
- 判定スイッチ `isNativeApp()` を app/_libs に1つ新設し、アプリ内分岐はすべてこれに集約。
- Bundle ID（案）: `com.arcodaviolin.app`（要Tetsuo承認）
- アプリ表示名（案）: 「アルコ」

## 2. ネイティブ録音プラグイン仕様（ArcodaRecorder）

### JS側インターフェース

```ts
isAvailable(): Promise<{ available: boolean }>
requestPermission(): Promise<{ granted: boolean }>
start(opts?: { sampleRate?: 48000 }): Promise<{ startedAtMs: number }>
stop(): Promise<{ path: string; durationMs: number; format: "flac" | "wav";
                 sampleRate: number; routeUsed: string }>
cancel(): Promise<void>
addListener("interruption", cb)   // 電話・アラーム割り込み (began/ended)
```

### iOS実装の要点

- AVAudioSession: category `.playAndRecord` + mode **`.measurement`**（加工なし保証）
  + `.defaultToSpeaker` + `.allowBluetoothA2DP`。テンポガイド音はWebView側の
  AudioContext再生を同一セッションで併用（measurementは入力のみに効く）。
- キャプチャ: AVAudioEngine inputNode タップ → 48kHz/16bit/モノ。
- 書き出し: **FLAC**（AVAudioFile + kAudioFormatFLAC, iOS11+のOS標準エンコーダ）。
  実装時にFLAC書き出しが不安定なら**WAVにフォールバック**（formatフィールドで申告。
  サーバーは両対応済みにするため事故にならない）。
- 保存先: アプリのキャッシュ領域。JS側がCapacitor Filesystemで読み出しBlob化→
  既存のアップロード経路（署名URL直PUT）へ。アップロード成功後にローカル削除。
- 割り込み: AVAudioSession interruption通知をJSへ中継。録音中の中断は
  「ここまでを保存/破棄」ダイアログ（Recorder側で処理）。
- start()解決時に`startedAtMs`（ホスト時計）を返し、テンポガイド開始時刻との
  突き合わせでタイミング採点の同期精度を確保する。

### Recorder.tsx統合（唯一のUI変更点）

- 録音開始処理の冒頭で `ArcodaRecorder.isAvailable()` → true ならネイティブ経路、
  false なら現行のgetUserMedia+MediaRecorder経路（**Web版は無変更で動き続ける**）。
- プレビュー再生: ネイティブ経路ではローカルファイルURLを`<audio>`で再生
  （WKWebViewはFLAC再生可）。
- onRecordingComplete へは従来同様Blobを渡す（mimeType: audio/flac）。
- 解析リクエストに録音経路 `recordingSource: "native" | "browser"` を添付（品質比較用）。

## 3. サーバー側の先行対応（Phase 0・アプリより先にリリース）

| # | ファイル | 変更 |
|---|---|---|
| 1 | app/actions/getSignedUploadUrl.ts | ALLOWED_MIMEに audio/flac (+保険で audio/wav)、EXT_BY_MIMEに flac/wav 追加 |
| 2 | app/_libs/audioValidation.ts | magic-byteに "fLaC"（+RIFF/WAVEは対応済）追加 |
| 3 | 同上 | MAX_AUDIO_BYTES 30MB → **64MB**（FLAC≈3MB/分×10分＋余裕。WAVフォールバック10分≈58MBも収まる） |
| 4 | music-analyzer/analyze_performance.py | ffmpeg変換分岐に ".flac" 追加（出力は現行同一の44.1k/mono/s16 WAV→解析ロジック影響ゼロ） |
| 5 | Cloud Run | 手動再デプロイ（既存手順） |

検証: 手作りFLACをアップロード→採点→聴き返しのE2Eを本番で通してからPhase 1へ。

### 伝送量の既知の影響（上限ではなくコスト）
Supabase転送量が約3倍ペースに（FLAC 3MB/分）。無料枠5GB/月はユーザー20〜30人で
逼迫見込み → Pro（$25/月・250GB）移行を課金開始と同時期に想定。

## 4. フェーズ計画

- **Phase 0**: サーバーFLAC対応＋E2E（アプリなしで完結・Web版に影響なし）
- **Phase 1**: Capacitor土台＋録音プラグイン実装（native/配下。Macでビルド）
- **Phase 2**: Recorder統合＋Tetsuo実機で録音品質検証（measurementの録れ音を実採点比較）
- **Phase 3**: プッシュ通知（審査4.2対策＋教育的価値）、アプリアイコン/スプラッシュ
- **Phase 4**: TestFlight配布→本審査提出

## 5. 審査対策メモ

- ガイドライン4.2（ただのWeb包装）: ネイティブ録音＋プッシュ通知で「Webで不可能な体験」を実装・説明
- マイク権限文言（案）: 「バイオリンの演奏を録音して採点するためにマイクを使用します」
- App Privacy: 収集=録音音声（解析目的・ユーザー紐づけ）/ メール / 名前。要ラベル申告
- 課金（3.1.1）: アプリ内からStripe Web課金への導線の扱いは**未決**。
  安全側の初期方針: `isNativeApp()` でアプリ内はプラン加入導線を非表示
  （既加入者の機能は全て使える）。スマホ新法の運用状況を見て開放を判断。

## 6. 未決事項（Tetsuo判断待ち）

1. Bundle ID `com.arcodaviolin.app` でよいか
2. アプリ表示名「アルコ」でよいか
3. 課金導線の初期方針（上記の安全側=非表示 で開始してよいか）

## 7. やらないこと（明示）

- PWA化（録音が改善しないため価値なし）
- UIのネイティブ書き直し（remote URL方式で共通化）
- Android版（iOS検証完了後に同設計で着手。UNPROCESSED→VOICE_RECOGNITION階段）

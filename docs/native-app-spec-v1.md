# ARC-SPEC-NATIVE-1.0 アプリ版（iOS先行）設計書

作成: 2026-08-14 / 更新: 2026-08-15 / 状態: Phase 0-2 実装済み

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
- Bundle ID: `com.arcodaviolin.app`（2026-08-15 確定）
- アプリ表示名: 「アルコ」（2026-08-15 確定）

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

- **Phase 0**: ✅ サーバーFLAC対応＋E2E（アプリなしで完結・Web版に影響なし）
- **Phase 1**: ✅ Capacitor土台＋録音プラグイン実装（native/配下。Macでビルド）→ §7
- **Phase 2**: ✅ Recorder統合＋実機でのネイティブ録音→FLAC→採点が本番で動作（2026-08-15）→ §7-2
- **Phase 3**: プッシュ通知（審査4.2対策＋教育的価値）、アプリアイコン/スプラッシュ
- **Phase 4**: TestFlight配布→本審査提出

## 5. 審査対策メモ

- ガイドライン4.2（ただのWeb包装）: ネイティブ録音＋プッシュ通知で「Webで不可能な体験」を実装・説明
- マイク権限文言（案）: 「バイオリンの演奏を録音して採点するためにマイクを使用します」
- App Privacy: 収集=録音音声（解析目的・ユーザー紐づけ）/ メール / 名前。要ラベル申告
- 課金（3.1.1）: アプリ内からStripe Web課金への導線の扱いは**未決**。
  安全側の初期方針: `isNativeApp()` でアプリ内はプラン加入導線を非表示
  （既加入者の機能は全て使える）。スマホ新法の運用状況を見て開放を判断。

## 6. 決定事項（2026-08-15 Tetsuo確定）

1. Bundle ID = `com.arcodaviolin.app`
2. アプリ表示名 = 「アルコ」
3. 課金導線は初回審査では**非表示**（安全側で開始。既加入者の機能は全て使える）

## 7. Phase 1 実装メモ（2026-08-15 完了）

実体は `native/` 配下。手順とトラブルシュートは [`native/README.md`](../native/README.md)。

### 設計からの差分（いずれも意図的）

| 項目 | 設計時 | 実装 | 理由 |
|---|---|---|---|
| Blob化 | Capacitor Filesystem で読み出し | プラグイン自身の `readChunk()` で分割読み | 最大64MBを一括base64化するとWebViewのメモリを圧迫する。分割で継ぎ足す方が安全で、依存も1つ減る |
| iOS連携 | CocoaPods 想定 | **SPM**（Capacitor 8 の既定） | CocoaPods 不要になり環境構築が軽い。podspec も残してあるので戻せる |
| イベント | `interruption` のみ | `interruption` / `maxDuration` / `routeChange` / `recordingError` | 上限10分到達・録音中の経路変更・書き込み失敗を Recorder 側が区別して扱えるようにするため |
| `start()` の解決 | 呼び出し直後 | **最初の音声バッファ到着時** | `startedAtMs` を「実際に最初のサンプルが録れた時刻」にしないとテンポガイドとの同期がずれる。5秒来なければ START_TIMEOUT で失敗させる |

### 環境要件（重要）

**Xcode 26 以上が必要。** Capacitor 8.5 が配布する `Capacitor.xcframework` は Swift 6.2
でビルドされており、`.swiftinterface` 内の `call.reject` 等が `$NonescapableTypes` で
囲まれている。Xcode 16 系（Swift 6.0）ではこれらが「存在しないAPI」と判定されて
プラグインがビルドできない。

**Intel Mac でも動く（2026-08-15 実測）。** 開発機は MacBook Pro 15-inch 2019
（Core i7-9750H / x86_64・macOS 15.7.9）。Xcode 26.1 (17B55) の実行バイナリは
`x86_64 arm64` のユニバーサルで、要求は macOS 15.6 以上。この環境で
iOS 26.1 SDK・arm64 / x86_64 の両スライスとも **BUILD SUCCEEDED**、
`App.debug.dylib` に `ArcodaRecorderPlugin` のシンボルとJSメソッド名が
含まれていることまで確認済み。「Xcode 26 は Apple Silicon 専用」ではない。

Capacitor 7 への降格（プランB）は**採らない**。Cap 7 には Cap 8 が生成する
`SceneDelegate` / `SceneDelegateProxy` が存在せず、iOSプロジェクトの作り直しが要る。
Xcode 26 が使えている以上、得るものがない。

`xcode-select` が古い方を指していると 16 系でビルドされてしまうので、
コマンドラインからビルドするときは `DEVELOPER_DIR` か `xcode-select -s` で
26.1 を指していることを確認する。

### 検証済み / 未検証

- 検証済み: Xcodeプロジェクト生成、プラグインのSPM認識、Swift のコンパイルと
  リンク（Xcode 26.1 / iOS 26.1 SDK で BUILD SUCCEEDED・プラグインのシンボルが
  実行バイナリに存在）、Web側の tsc / eslint / vitest（445件パス）
- 検証済み（2026-08-15 実機・本番）: ネイティブ録音→FLAC書き出し→アップロード→
  ローカル削除までの全経路（§7-2）
- 未検証: 録れ音の**品質そのもの**（Web版との実採点比較）・`startedAtMs` の同期精度

## 7-2. Phase 2 実装メモ（2026-08-15 完了）

`Recorder.tsx` にネイティブ録音経路を統合した。Web版の挙動は変えず、
`nativeReadyRef`（= `isNativeRecorderAvailable()`）が真のときだけ分岐する。

| 局面 | Web版（変更なし） | アプリ版（新規） |
|---|---|---|
| 権限取得 | `getUserMedia` | `checkPermission` → `requestPermission`。**`getUserMedia` は呼ばない**（WebView が入力を掴むと `.measurement` が崩れ、加工なし録音という価値の本体が失われる） |
| 録音 | `MediaRecorder` | `startNativeRecording({ sampleRate: 48000, maxDurationSec: 600 })` |
| 音量メーター | `AnalyserNode` | プラグインの **`level` イベント**（新設） |
| 停止 | `recorder.stop()` | `stopNativeRecording()` → `readNativeRecordingBlob()` |
| 中断・上限 | なし | `interruption` / `maxDuration` を購読し、そこまでを preview に載せる |
| 後片付け | Blob を捨てるだけ | アップロード成功・撮り直し・破棄で `deleteNativeRecording()` |

### 設計からの差分（Phase 2）

| 項目 | 設計時 | 実装 | 理由 |
|---|---|---|---|
| 音量メーター | 言及なし | プラグインに `level` イベントを新設 | アプリ版は MediaStream を持たないので AnalyserNode が使えない。入力タップの生バッファから RMS/ピークを 20fps で送り、Web版と同じメーター表示にした |
| 停止の合流点 | 停止ボタンのみ | `finalizeNative()` に停止・上限10分・中断を合流 | 3経路が同時に来ても二重に stop() しないよう `nativeFinalizingRef` で一本化 |
| 品質チェック | 言及なし | `decodeAudioData` 失敗時は波形と判定を諦めて preview へ進む | FLAC をデコードできない環境でも録音とアップロードは通す（採点はサーバー側で行う） |

### 実機検証の結果（2026-08-15 本番で成功）

Tetsuo の iPhone 17 + 本番サイトで、ネイティブ録音の全経路が通った。

```
JS→isAvailable() → checkPermission() granted → addListener ×4 → JS→start()
configureSession(): hw=48000Hz in=MicrophoneBuiltIn out=Speaker otherAudioPlaying=true
startEngine(): inputFormat 48000Hz ch=1 → engine.start() 成功
consume(): 最初のバッファ到着                    ← START_TIMEOUT せず
finalize(): flac 986789bytes 26173ms fallback=false
readChunk(): offset=0 read=986789 total=986789 eof=true
deleteFile → {"deleted":true}                    ← アップロード成功後の削除
```

**48kHz / モノ / FLAC・26.2秒・約987KB・WAVフォールバックなし。**

### 真因だった不具合: `registerPlugin` は注入ブリッジに無い

Phase 2 の統合後もアプリ内の録音がすべて webm になっていた。原因は
`getPlugin()` が `window.Capacitor.registerPlugin` の存在を要求していたこと。

remote URL 方式で WebView に入るのは Capacitor の**注入ブリッジ
(`native-bridge.js`) だけ**で、`registerPlugin` は `@capacitor/core`
(JS ランタイム) 側の API なので生えない。結果 `getPlugin()` が常に null を返し、
アプリ内でも従来の MediaRecorder 経路へ静かに落ちていた。

注入ブリッジが公開しているのは以下。プラグインを呼ぶときはこれを使う。

| API | 用途 |
|---|---|
| `nativePromise(plugin, method, options)` | メソッド呼び出し (options は `{}` を必ず渡す) |
| `addListener(plugin, event, cb)` | イベント購読。戻り値は `{ remove }` |
| `isPluginAvailable(name)` | `Capacitor.Plugins` にキーがあるかを見るだけ |

`isPluginAvailable` は true を返すのに呼び出しができない、という紛らわしい状態に
なるので注意。**Android 版でも同じ罠を踏む**ので、同設計で着手するときは
最初からこの形で書くこと。

### 検証で分かった「起きなかったこと」

事前に疑っていた2点は、実機ログで**どちらも起きないことが確認された**。

- **WebView の AudioContext と AVAudioSession の取り合い**: カウントイン音を
  WebAudio で鳴らした直後に `start()` しても、`otherAudioPlaying=true` のまま
  `engine.start()` は成功し最初のバッファも届く。両者は共存できる
- **stop 後の readChunk / Blob 化**: 約987KB を1回で読み切り `eof=true`。
  分割読みの仕組みは効いているが、この規模では分割自体が発生しない

### 残っている接続（Phase 3 以降）

`start()` が返す `startedAtMs`（最初のサンプルが実際に録れた壁時計ms）は
`nativeStartedAtRef` に保持しているが、**まだアップロードに載せていない**。
`onRecordingComplete(blob)` が Blob しか受け取らない契約で、変更すると
`scoreDetail.tsx` 側の署名も動くため、タイミング採点の同期改善は次フェーズに送る。

## 8. やらないこと（明示）

- PWA化（録音が改善しないため価値なし）
- UIのネイティブ書き直し（remote URL方式で共通化）
- Android版（iOS検証完了後に同設計で着手。UNPROCESSED→VOICE_RECOGNITION階段）

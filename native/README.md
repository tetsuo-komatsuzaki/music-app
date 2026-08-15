# アルコ iOS アプリの殻 (ARC-SPEC-NATIVE-1.0 / Phase 1)

設計書: [`docs/native-app-spec-v1.md`](../docs/native-app-spec-v1.md)

`https://arcodaviolin.com` をそのまま表示する Capacitor の殻と、自作のネイティブ録音
プラグインが入っている。UI とロジックは Web 版と同一 (`app/`) で、Vercel にデプロイ
すれば Web / アプリ同時に反映される。審査への再提出が要るのは、この `native/` 配下を
変更したときだけ。

| | |
|---|---|
| Bundle ID | `com.arcodaviolin.app` |
| 表示名 | アルコ |
| 最低 iOS | 15.0 |
| Capacitor | 8.5 (iOS 連携は SPM。CocoaPods 不要) |
| 同梱プラグイン | ArcodaRecorder (自作) / ScreenOrientation / Browser / App |

## 必要な環境

- **Xcode 26 以上** — Capacitor 8.5 が配布する `Capacitor.xcframework` は Swift 6.2
  でビルドされており、Xcode 16 系ではブリッジ API (`call.reject` など) が
  「存在しない」扱いになってビルドが通らない。
  **Intel Mac でも動く**: Xcode 26.1 の実行バイナリは `x86_64 arm64` の
  ユニバーサルで、要求は macOS 15.6 以上。開発機 (MacBook Pro 15-inch 2019 /
  Core i7-9750H / macOS 15.7.9) で iOS 26.1 SDK・arm64 / x86_64 とも
  ビルド確認済み (2026-08-15)。
- Node.js 22 系

Mac に複数の Xcode が入っている場合、`xcode-select -p` が 26 系を指しているか
確かめること。指していなければコマンドラインからのビルドは古い方で走る。

```bash
xcode-select -p                                   # 現在の向き先
sudo xcode-select -s /Applications/Xcode.app      # 26 系に向ける
# 切り替えずに一度だけ試すなら:
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npx cap sync ios
```

### コマンドラインでのビルド確認

Xcode を開かずにプラグインまで通るか確かめたいときは、署名なしでシミュレータ向けに
ビルドすればよい (実機は不要)。

```bash
cd native/ios/App
xcodebuild -project App.xcodeproj -scheme App -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -configuration Debug \
  CODE_SIGNING_ALLOWED=NO build
```

プラグインが本当に組み込まれたかは、生成物のシンボルで確認できる
(Debug ビルドの実体は `App` ではなく `App.debug.dylib` 側にある)。

```bash
nm -a -arch x86_64 <DerivedData>/Build/Products/Debug-iphonesimulator/App.app/App.debug.dylib \
  | grep -c -i arcoda
```

## セットアップ

```bash
cd native
npm install
npx cap sync ios     # 設定とプラグインをXcodeプロジェクトへ反映
npx cap open ios     # Xcodeで開く
```

Xcode 側で Signing & Capabilities に開発チームを設定すれば実機に流せる。

`ios/` はコミット済みなので `cap add ios` を再実行する必要はない。
やり直す場合は `rm -rf ios && npx cap add ios` の後、
[Info.plist の手当て](#infoplist-の手当て) をやり直すこと。

## 構成

```
native/
├─ capacitor.config.ts            殻の設定 (server.url = 本番サイト)
├─ www/index.html                 サイトに繋がらないときの案内 (通常は表示されない)
├─ ios/App/                       Capacitor が生成した Xcode プロジェクト
└─ plugins/arcoda-recorder/       自作のネイティブ録音プラグイン
   ├─ Package.swift               SPM 連携 (product 名は "ArcodaRecorder" 固定)
   ├─ ArcodaRecorder.podspec      CocoaPods に戻したくなったとき用
   ├─ src/definitions.ts          JS 側インターフェースの正本
   └─ ios/Sources/ArcodaRecorderPlugin/
      ├─ ArcodaRecorder.swift       録音エンジン (セッション・キャプチャ・書き出し)
      └─ ArcodaRecorderPlugin.swift WebView との橋渡し
```

Web アプリ側の入口:

- `app/_libs/isNativeApp.ts` — アプリ版かどうかの唯一の判定スイッチ
- `app/_hooks/useIsNativeApp.ts` — 表示の出し分け用 (ハイドレーション安全)
- `app/_libs/arcodaRecorder.ts` — 録音プラグインの型付きクライアント

Next.js 側に `@capacitor/core` は入れていない。Capacitor が WebView に注入する
`window.Capacitor` を直接使うので、Web 版のバンドルは一切太らない。

## 録音の要点

- `AVAudioSession` は category `.playAndRecord` / mode **`.measurement`**。
  `.measurement` が AGC・ノイズ抑制・EQ といった入力側の加工を止める。
  ブラウザ録音では確実に切れないこの部分が、アプリ化の価値の本体。
- `.defaultToSpeaker` + `.allowBluetoothA2DP` の組み合わせにより、テンポガイド音は
  スピーカー / BT イヤホンから鳴らしつつ、入力は本体マイクのまま維持する
  (HFP に落ちて品質が落ちるのを避ける)。
- 書き出しは 48kHz / 16bit / モノの **FLAC**。OS の FLAC エンコーダが使えない場合は
  **WAV** に自動フォールバックし、`format` フィールドで JS に申告する。
  サーバーは両方受け付ける (spec §3) ので事故にならない。
- `start()` は「最初のサンプルが実際にマイクから出た時刻」を壁時計 ms で返す。
  テンポガイドの開始時刻と突き合わせることでタイミング採点の同期精度を確保する。
- 電話・アラームによる中断、上限 10 分到達、メディアサービスのリセットでは
  **そこまでを確定** して JS にイベントを送る。自動再開はしない
  (「保存 / 破棄」の判断は Recorder 側の UI に委ねる)。
- 録音ファイルはアプリのキャッシュ領域に置き、アップロード成功後に
  `deleteNativeRecording()` で削除する。取りこぼしても 24 時間で自動削除される。

## 同梱プラグイン

| プラグイン | 用途 | 呼ぶ側 |
|---|---|---|
| `arcoda-recorder` (自作) | 加工なしのネイティブ録音 (spec §2) | `app/_libs/arcodaRecorder.ts` |
| `@capacitor/screen-orientation` | 横画面録音モードの向きロック (spec §9a) | `app/_libs/arcodaOrientation.ts` |
| `@capacitor/browser` | Googleログインの認証用アプリ内ブラウザ (spec §9b) | Web側 |
| `@capacitor/app` | `appUrlOpen` で `arcoda://auth-callback` を受ける (spec §9b) | Web側 |

ネイティブ側に書くコードは無い (殻に同梱するだけ)。呼び出しは全て Web 側の JS が
注入ブリッジ経由で行う。`registerPlugin` は注入ブリッジに無いので
`nativePromise` / `addListener` を使うこと (spec §7-2 の真因を参照)。

## Info.plist の手当て

`cap add ios` の生成物に対して以下を追記済み。プロジェクトを作り直したら再度必要。

| キー | 値 | 理由 |
|---|---|---|
| `NSMicrophoneUsageDescription` | バイオリンの演奏を録音して採点するためにマイクを使用します | マイク権限 (審査必須) |
| `UIBackgroundModes` | `audio` | 画面ロック中も録音を継続する |
| `ITSAppUsesNonExemptEncryption` | `false` | TestFlight 配布時の輸出コンプライアンス質問を省略 |
| `CFBundleURLTypes` | scheme `arcoda` / name `com.arcodaviolin.app.auth` | Googleログイン後に `arcoda://auth-callback` でアプリへ戻す (spec §9b) |
| `UIRequiresFullScreen` | `true` | iPad はマルチタスキング対応だと向きロックAPIが効かないため (spec §9a) |

横向き (`UIInterfaceOrientationLandscapeLeft` / `Right`) は Capacitor の生成
テンプレートに最初から入っているので追記不要。`~ipad` 側も同様。

## 次のフェーズ

- **Phase 2**: `Recorder.tsx` の統合は完了 (設計書 §7-2)。残りは実機での録れ音の実採点比較
- **Phase 3**: プッシュ通知、アプリアイコン / スプラッシュ
- **Phase 4**: TestFlight 配布 → 本審査提出

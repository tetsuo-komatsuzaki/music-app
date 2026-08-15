/**
 * ArcodaRecorder のネイティブ契約 (ARC-SPEC-NATIVE-1.0 §2)。
 *
 * Web アプリ側からは `app/_libs/arcodaRecorder.ts` のラッパー経由で呼ぶ。
 * ここは「ネイティブ実装が何を返すか」の正本であり、
 * Swift 側 (ios/Sources/ArcodaRecorderPlugin/) と対にして更新する。
 */

export type RecordingFormat = "flac" | "wav"

export type MicPermissionStatus = "granted" | "denied" | "prompt"

export interface ArcodaRecorderAvailability {
  available: boolean
  platform: "ios"
  osVersion: string
}

export interface MicPermissionResult {
  granted: boolean
  status: MicPermissionStatus
}

export interface StartOptions {
  /** 書き出しサンプルレート。既定 48000。 */
  sampleRate?: number
  /** 上限時間 (秒)。既定 600 = APP_CONFIG.recording.maxDurationSec。 */
  maxDurationSec?: number
}

export interface StartResult {
  /**
   * 最初のサンプルが実際にマイクから出た時刻 (JS の Date.now() と同じ壁時計 ms)。
   * テンポガイドの開始時刻と突き合わせてタイミング採点の同期を取るための値。
   */
  startedAtMs: number
  sampleRate: number
}

export interface StopResult {
  /** ローカルファイルの絶対パス。readChunk / deleteFile にはこれを渡す。 */
  path: string
  /** file:// 形式の URI */
  uri: string
  /** WebView から再生できる URL (取得できない場合は undefined) */
  webPath?: string
  durationMs: number
  format: RecordingFormat
  /** アップロード時に使う MIME (audio/flac | audio/wav) */
  mimeType: string
  sampleRate: number
  channels: number
  bytes: number
  /** 使用した入出力ルート (品質比較・不具合調査用) */
  routeUsed: string
  startedAtMs: number
  hardwareSampleRate: number
  /** FLAC で書けず WAV に落ちた場合 true */
  didFallback: boolean
}

export interface ReadChunkOptions {
  path: string
  /** 読み出し開始バイト位置。既定 0。 */
  offset?: number
  /** 読み出しバイト数。既定 2MB / 上限 4MB。 */
  length?: number
}

export interface ReadChunkResult {
  /** base64 */
  data: string
  bytesRead: number
  totalBytes: number
  eof: boolean
}

export interface InterruptionEvent {
  /** began = 電話・アラーム等で録音が中断された (ファイルはそこまでで確定済み) */
  type: "began" | "ended"
  shouldResume: boolean
}

export interface RouteChangeEvent {
  routeUsed: string
}

export interface MaxDurationEvent {
  durationMs: number
}

export interface RecordingErrorEvent {
  code: string
  message: string
}

/**
 * 録音中の入力レベル (0...1)。既定 20fps で送られる。
 * Web 版は AnalyserNode から同じ値を作るので、Recorder 側は
 * どちらの経路でも同じメーター表示になる。
 */
export interface LevelEvent {
  rms: number
  peak: number
}

export interface ArcodaRecorderPlugin {
  isAvailable(): Promise<ArcodaRecorderAvailability>
  checkPermission(): Promise<MicPermissionResult>
  requestPermission(): Promise<MicPermissionResult>
  start(options?: StartOptions): Promise<StartResult>
  stop(): Promise<StopResult>
  cancel(): Promise<void>
  readChunk(options: ReadChunkOptions): Promise<ReadChunkResult>
  deleteFile(options: { path: string }): Promise<{ deleted: boolean }>
}

/** エラー時に reject される code の一覧 */
export type ArcodaRecorderErrorCode =
  | "BUSY"
  | "NOT_RECORDING"
  | "PERMISSION_DENIED"
  | "SESSION_ERROR"
  | "ENGINE_ERROR"
  | "NO_INPUT"
  | "WRITE_ERROR"
  | "START_TIMEOUT"
  | "INVALID_PATH"
  | "IO_ERROR"
  | "UNKNOWN"

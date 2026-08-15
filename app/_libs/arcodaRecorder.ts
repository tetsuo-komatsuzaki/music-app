// ARC-SPEC-NATIVE-1.0 §2 — ネイティブ録音プラグイン (ArcodaRecorder) のJS側クライアント。
//
// 実装は native/plugins/arcoda-recorder/ios/Sources/ArcodaRecorderPlugin/ にあり、
// 型の正本は native/plugins/arcoda-recorder/src/definitions.ts。
// ここはそれをWebアプリから安全に呼ぶための薄いラッパーで、
// Capacitor が WebView に注入するブリッジ経由で通信する
// (@capacitor/core をWeb版のバンドルに入れないための方針)。
//
// Web版ブラウザでは isNativeRecorderAvailable() が false を返すので、
// 呼び出し側は従来の getUserMedia + MediaRecorder 経路をそのまま使う。

import { getCapacitor, isNativeApp, type CapacitorBridge } from "@/app/_libs/isNativeApp"

const PLUGIN_NAME = "ArcodaRecorder"

export type RecordingFormat = "flac" | "wav"

export type MicPermissionStatus = "granted" | "denied" | "prompt"

export interface MicPermissionResult {
  granted: boolean
  status: MicPermissionStatus
}

export interface NativeStartOptions {
  /** 書き出しサンプルレート。既定 48000。 */
  sampleRate?: number
  /** 上限時間(秒)。既定 600 = APP_CONFIG.recording.maxDurationSec。 */
  maxDurationSec?: number
}

export interface NativeStartResult {
  /**
   * 最初のサンプルが実際にマイクから出た時刻 (Date.now() と同じ壁時計ms)。
   * テンポガイドの開始時刻と突き合わせてタイミング採点の同期を取るための値。
   */
  startedAtMs: number
  sampleRate: number
}

export interface NativeStopResult {
  path: string
  uri: string
  webPath?: string
  durationMs: number
  format: RecordingFormat
  /** audio/flac | audio/wav */
  mimeType: string
  sampleRate: number
  channels: number
  bytes: number
  routeUsed: string
  startedAtMs: number
  hardwareSampleRate: number
  /** FLACで書けずWAVに落ちた場合 true */
  didFallback: boolean
}

export interface NativeInterruptionEvent {
  /** began = 電話・アラーム等で中断。録音はそこまでで確定済みなので stop() で取り出せる */
  type: "began" | "ended"
  shouldResume: boolean
}

export interface NativeMaxDurationEvent {
  durationMs: number
}

export interface NativeRecordingErrorEvent {
  code: string
  message: string
}

/**
 * 録音中の入力レベル (0...1)。既定 20fps。
 * アプリ版は MediaStream を持たないので、Web版で AnalyserNode が担っている
 * 音量メーターの入力をこのイベントで置き換える。
 */
export interface NativeLevelEvent {
  rms: number
  peak: number
}

interface PluginHandle {
  isAvailable(): Promise<{ available: boolean; platform: string; osVersion: string }>
  checkPermission(): Promise<MicPermissionResult>
  requestPermission(): Promise<MicPermissionResult>
  start(options?: NativeStartOptions): Promise<NativeStartResult>
  stop(): Promise<NativeStopResult>
  cancel(): Promise<void>
  readChunk(options: { path: string; offset?: number; length?: number }): Promise<{
    data: string
    bytesRead: number
    totalBytes: number
    eof: boolean
  }>
  deleteFile(options: { path: string }): Promise<{ deleted: boolean }>
  addListener(eventName: string, handler: (event: never) => void): Promise<{ remove: () => Promise<void> }>
}

let cached: PluginHandle | null = null

/**
 * 注入ブリッジ (native-bridge.js) の低レベルAPIからプラグインの呼び口を組み立てる。
 *
 * remote URL 方式では WebView に入るのは注入ブリッジだけで、
 * `registerPlugin` は生えない (あれは @capacitor/core 側のAPI)。
 * 代わりに `nativePromise` と `addListener` が公開されているので、そこから作る。
 */
function buildHandleFromBridge(capacitor: CapacitorBridge): PluginHandle | null {
  const nativePromise = capacitor.nativePromise
  const addNativeListener = capacitor.addListener
  if (typeof nativePromise !== "function" || typeof addNativeListener !== "function") return null

  // options を undefined のまま渡すとブリッジ側で落ちるので必ずオブジェクトにする
  const call = <T>(method: string, options?: unknown): Promise<T> =>
    nativePromise(PLUGIN_NAME, method, options ?? {}) as Promise<T>

  return {
    isAvailable: () => call("isAvailable"),
    checkPermission: () => call("checkPermission"),
    requestPermission: () => call("requestPermission"),
    start: (options) => call("start", options),
    stop: () => call("stop"),
    cancel: () => call("cancel"),
    readChunk: (options) => call("readChunk", options),
    deleteFile: (options) => call("deleteFile", options),
    addListener: async (eventName, handler) => addNativeListener(PLUGIN_NAME, eventName, handler),
  }
}

function getPlugin(): PluginHandle | null {
  if (cached) return cached
  const capacitor = getCapacitor()
  if (!capacitor || !isNativeApp()) return null
  // 殻に組み込まれていないビルド (旧バージョンのアプリ) では登録されていない
  if (capacitor.isPluginAvailable && !capacitor.isPluginAvailable(PLUGIN_NAME)) return null

  // @capacitor/core を積んだ環境ならそちらを優先 (現状のWeb版では積んでいない)
  if (typeof capacitor.registerPlugin === "function") {
    cached = capacitor.registerPlugin<PluginHandle>(PLUGIN_NAME)
    return cached
  }
  cached = buildHandleFromBridge(capacitor)
  return cached
}

/**
 * ネイティブ録音が使えるか。録音開始処理の冒頭でこれを見て経路を分ける。
 * false のときは現行の getUserMedia + MediaRecorder 経路 (Web版は無変更)。
 */
export async function isNativeRecorderAvailable(): Promise<boolean> {
  const plugin = getPlugin()
  if (!plugin) {
    // [一時診断] アプリ内でネイティブ経路に入れない原因の切り分け用。
    // Capacitor が console を実機ログへ転送するので、実機で読める。
    // 原因が判明したら消す。
    const capacitor = getCapacitor()
    console.log(
      "[native/diag] capacitor=", !!capacitor,
      "isNativeApp=", isNativeApp(),
      "platform=", capacitor?.getPlatform?.(),
      "pluginAvailable=", capacitor?.isPluginAvailable?.(PLUGIN_NAME),
      "hasRegisterPlugin=", typeof capacitor?.registerPlugin,
      "hasNativePromise=", typeof capacitor?.nativePromise,
      "hasAddListener=", typeof capacitor?.addListener,
    )
    return false
  }
  try {
    const result = await plugin.isAvailable()
    return result.available === true
  } catch {
    return false
  }
}

export async function checkMicPermission(): Promise<MicPermissionResult> {
  const plugin = requirePlugin()
  return plugin.checkPermission()
}

export async function requestMicPermission(): Promise<MicPermissionResult> {
  const plugin = requirePlugin()
  return plugin.requestPermission()
}

export async function startNativeRecording(options?: NativeStartOptions): Promise<NativeStartResult> {
  const plugin = requirePlugin()
  return plugin.start(options)
}

export async function stopNativeRecording(): Promise<NativeStopResult> {
  const plugin = requirePlugin()
  return plugin.stop()
}

export async function cancelNativeRecording(): Promise<void> {
  const plugin = getPlugin()
  if (!plugin) return
  try {
    await plugin.cancel()
  } catch {
    // 録音していない状態でのキャンセルは無視してよい
  }
}

/**
 * 録音ファイルをBlob化する。
 *
 * 一括読みだと最大64MBのファイルがbase64で1.3倍に膨らんでWebViewを圧迫するので、
 * ネイティブ側から分割で受け取って継ぎ足す。
 */
export async function readNativeRecordingBlob(result: NativeStopResult): Promise<Blob> {
  const plugin = requirePlugin()
  const parts: BlobPart[] = []
  let offset = 0

  for (;;) {
    const chunk = await plugin.readChunk({ path: result.path, offset })
    if (chunk.bytesRead > 0) {
      parts.push(base64ToBytes(chunk.data))
      offset += chunk.bytesRead
    }
    if (chunk.eof || chunk.bytesRead === 0) break
  }

  return new Blob(parts, { type: result.mimeType })
}

/** アップロード成功後にローカルの録音を消す。 */
export async function deleteNativeRecording(path: string): Promise<void> {
  const plugin = getPlugin()
  if (!plugin) return
  try {
    await plugin.deleteFile({ path })
  } catch {
    // 消せなくても致命的ではない (ネイティブ側が24時間で掃除する)
  }
}

export function addInterruptionListener(handler: (event: NativeInterruptionEvent) => void) {
  return addListener<NativeInterruptionEvent>("interruption", handler)
}

export function addMaxDurationListener(handler: (event: NativeMaxDurationEvent) => void) {
  return addListener<NativeMaxDurationEvent>("maxDuration", handler)
}

export function addRecordingErrorListener(handler: (event: NativeRecordingErrorEvent) => void) {
  return addListener<NativeRecordingErrorEvent>("recordingError", handler)
}

export function addLevelListener(handler: (event: NativeLevelEvent) => void) {
  return addListener<NativeLevelEvent>("level", handler)
}

async function addListener<T>(eventName: string, handler: (event: T) => void): Promise<() => void> {
  const plugin = getPlugin()
  if (!plugin) return () => {}
  const handle = await plugin.addListener(eventName, handler as (event: never) => void)
  return () => {
    void handle.remove()
  }
}

function requirePlugin(): PluginHandle {
  const plugin = getPlugin()
  if (!plugin) throw new Error("ArcodaRecorder はこの環境では利用できません")
  return plugin
}

function base64ToBytes(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

import AVFoundation
import Foundation

/// ARC-SPEC-NATIVE-1.0 §2 — 加工なし録音エンジン。
///
/// ブラウザの getUserMedia は OS 側の音声加工 (AGC / ノイズ抑制 / EQ) を
/// 確実に切れず、さらに非可逆圧縮が挟まる。ここでは
/// AVAudioSession の mode `.measurement` で入力加工を止め、
/// AVAudioEngine のタップから 48kHz/16bit/モノを FLAC (不可なら WAV) で
/// 直接書き出す。採点の入力品質そのものがアプリ化の価値の本体。
enum ArcodaRecorderError: LocalizedError {
    case busy
    case notRecording
    case permissionDenied
    case sessionFailed(String)
    case engineFailed(String)
    case noInput
    case writeFailed(String)
    case startTimeout
    case invalidPath
    case ioFailed(String)

    var code: String {
        switch self {
        case .busy: return "BUSY"
        case .notRecording: return "NOT_RECORDING"
        case .permissionDenied: return "PERMISSION_DENIED"
        case .sessionFailed: return "SESSION_ERROR"
        case .engineFailed: return "ENGINE_ERROR"
        case .noInput: return "NO_INPUT"
        case .writeFailed: return "WRITE_ERROR"
        case .startTimeout: return "START_TIMEOUT"
        case .invalidPath: return "INVALID_PATH"
        case .ioFailed: return "IO_ERROR"
        }
    }

    var errorDescription: String? {
        switch self {
        case .busy: return "すでに録音中です"
        case .notRecording: return "録音が開始されていません"
        case .permissionDenied: return "マイクの使用が許可されていません"
        case .sessionFailed(let m): return "オーディオセッションを準備できませんでした: \(m)"
        case .engineFailed(let m): return "録音エンジンを開始できませんでした: \(m)"
        case .noInput: return "マイク入力が見つかりませんでした"
        case .writeFailed(let m): return "録音ファイルの書き込みに失敗しました: \(m)"
        case .startTimeout: return "マイクからの入力が始まりませんでした"
        case .invalidPath: return "録音ファイルのパスが不正です"
        case .ioFailed(let m): return "録音ファイルを読み書きできませんでした: \(m)"
        }
    }
}

struct ArcodaRecordingResult {
    let url: URL
    let durationMs: Double
    let format: String
    let sampleRate: Double
    let channels: Int
    let bytes: Int
    let routeUsed: String
    let startedAtMs: Double
    let hardwareSampleRate: Double
    /// FLAC で書き出せず WAV に落ちたか (サーバーは両対応済みなので事故にはならない)
    let didFallback: Bool
}

enum ArcodaRecorderEvent {
    case interruption(began: Bool, shouldResume: Bool)
    case routeChange(route: String)
    /// 上限時間に達したので録音を確定した (JS は stop() を呼べば結果を受け取れる)
    case maxDuration(durationMs: Double)
    case failure(code: String, message: String)
}

final class ArcodaRecorder {
    private enum State {
        case idle
        /// engine 起動済み・最初のバッファ待ち
        case starting
        case recording
        /// 割り込み等でファイルを確定済み。stop() が結果を取りに来るのを待つ
        case finalized
    }

    static let defaultSampleRate: Double = 48000
    /// APP_CONFIG.recording.maxDurationSec と同じ 600 秒。暴走防止のハードキャップ。
    static let defaultMaxDurationSec: Double = 600
    private static let startTimeoutSec: Double = 5

    /// 状態とファイル書き込みはすべてこのシリアルキュー上で行う。
    /// タップのコールバックはリアルタイム音声スレッドなので、
    /// バッファを複製してここに投げ直す。
    private let queue = DispatchQueue(label: "com.arcodaviolin.app.recorder", qos: .userInitiated)

    private var engine = AVAudioEngine()
    private var converter: AVAudioConverter?
    private var file: AVAudioFile?
    private var fileURL: URL?
    private var state: State = .idle

    private var format = "flac"
    private var didFallback = false
    private var targetSampleRate = ArcodaRecorder.defaultSampleRate
    private var hardwareSampleRate: Double = 0
    private var framesWritten: AVAudioFramePosition = 0
    private var maxFrames: AVAudioFramePosition = 0
    private var startedAtMs: Double = 0
    private var routeUsed = ""

    /// mach 時刻 → 壁時計 (JS の Date.now() と比較可能な ms) への写像の基準点
    private var hostRefSeconds: Double = 0
    private var wallRefMs: Double = 0

    private var pendingStart: ((Result<Double, Error>) -> Void)?
    private var startTimeoutItem: DispatchWorkItem?
    private var finalizedResult: ArcodaRecordingResult?

    /// イベント通知 (メインキューで呼ばれる)
    var onEvent: ((ArcodaRecorderEvent) -> Void)?

    init() {
        registerObservers()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - 権限

    static func permissionGranted() -> Bool {
        if #available(iOS 17.0, *) {
            return AVAudioApplication.shared.recordPermission == .granted
        }
        return AVAudioSession.sharedInstance().recordPermission == .granted
    }

    static func permissionStatus() -> String {
        let value: String
        if #available(iOS 17.0, *) {
            switch AVAudioApplication.shared.recordPermission {
            case .granted: value = "granted"
            case .denied: value = "denied"
            default: value = "prompt"
            }
        } else {
            switch AVAudioSession.sharedInstance().recordPermission {
            case .granted: value = "granted"
            case .denied: value = "denied"
            default: value = "prompt"
            }
        }
        return value
    }

    static func requestPermission(_ completion: @escaping (Bool) -> Void) {
        let deliver: (Bool) -> Void = { granted in
            DispatchQueue.main.async { completion(granted) }
        }
        if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission(completionHandler: deliver)
        } else {
            AVAudioSession.sharedInstance().requestRecordPermission(deliver)
        }
    }

    // MARK: - 録音開始

    func start(sampleRate: Double?,
               maxDurationSec: Double?,
               completion: @escaping (Result<Double, Error>) -> Void) {
        queue.async {
            guard self.state == .idle else {
                self.deliverStart(completion, .failure(ArcodaRecorderError.busy))
                return
            }
            guard ArcodaRecorder.permissionGranted() else {
                self.deliverStart(completion, .failure(ArcodaRecorderError.permissionDenied))
                return
            }

            self.reset()
            self.targetSampleRate = sampleRate ?? ArcodaRecorder.defaultSampleRate
            let cap = maxDurationSec ?? ArcodaRecorder.defaultMaxDurationSec
            self.maxFrames = cap > 0 ? AVAudioFramePosition(cap * self.targetSampleRate) : 0

            do {
                try self.configureSession()
                try self.prepareFile()
                try self.startEngine()
            } catch {
                self.teardown(deleteFile: true)
                self.deliverStart(completion, .failure(error))
                return
            }

            self.state = .starting
            self.pendingStart = completion

            // 最初のバッファが来ない = 実質録れていない。無音のまま進ませない。
            let timeout = DispatchWorkItem { [weak self] in
                guard let self, self.state == .starting else { return }
                let pending = self.pendingStart
                self.pendingStart = nil
                self.teardown(deleteFile: true)
                self.deliverStart(pending, .failure(ArcodaRecorderError.startTimeout))
            }
            self.startTimeoutItem = timeout
            self.queue.asyncAfter(deadline: .now() + ArcodaRecorder.startTimeoutSec, execute: timeout)
        }
    }

    // MARK: - 停止 / 中止

    func stop(completion: @escaping (Result<ArcodaRecordingResult, Error>) -> Void) {
        queue.async {
            switch self.state {
            case .recording, .starting:
                self.finalize()
            case .finalized:
                break
            case .idle:
                DispatchQueue.main.async { completion(.failure(ArcodaRecorderError.notRecording)) }
                return
            }

            guard let result = self.finalizedResult else {
                DispatchQueue.main.async { completion(.failure(ArcodaRecorderError.notRecording)) }
                return
            }
            self.finalizedResult = nil
            self.state = .idle
            DispatchQueue.main.async { completion(.success(result)) }
        }
    }

    func cancel(completion: @escaping () -> Void) {
        queue.async {
            let pending = self.pendingStart
            self.pendingStart = nil
            self.teardown(deleteFile: true)
            self.deliverStart(pending, .failure(ArcodaRecorderError.notRecording))
            DispatchQueue.main.async { completion() }
        }
    }

    // MARK: - セッション / エンジン

    private func configureSession() throws {
        let session = AVAudioSession.sharedInstance()
        do {
            // .measurement が入力側の加工 (AGC・ノイズ抑制・EQ) を無効化する。
            // .defaultToSpeaker + .allowBluetoothA2DP により、テンポガイド音は
            // 本体スピーカー / BT イヤホン(A2DP) から鳴らしつつ、
            // 入力は本体マイクのまま (HFP に落とさない) を維持する。
            try session.setCategory(.playAndRecord,
                                    mode: .measurement,
                                    options: [.defaultToSpeaker, .allowBluetoothA2DP])
            try session.setPreferredSampleRate(targetSampleRate)
            try session.setPreferredIOBufferDuration(0.02)
            if #available(iOS 14.5, *) {
                // 通知バナー等での録音中断を減らす (失敗しても録音自体は続行可能)
                try? session.setPrefersNoInterruptionsFromSystemAlerts(true)
            }
            try session.setActive(true, options: [])
        } catch {
            throw ArcodaRecorderError.sessionFailed(error.localizedDescription)
        }
        hardwareSampleRate = session.sampleRate
        routeUsed = ArcodaRecorder.describeRoute(session.currentRoute)
    }

    private func startEngine() throws {
        // セッション設定後に inputNode を触る (順序が逆だとフォーマットが 0Hz になる)
        engine = AVAudioEngine()
        let input = engine.inputNode
        let inputFormat = input.outputFormat(forBus: 0)
        guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
            throw ArcodaRecorderError.noInput
        }
        guard let file else { throw ArcodaRecorderError.noInput }

        guard let converter = AVAudioConverter(from: inputFormat, to: file.processingFormat) else {
            throw ArcodaRecorderError.engineFailed("フォーマット変換を初期化できませんでした")
        }
        // 変換器は録音中ずっと使い回す (リサンプラの内部状態を切らさないため)
        self.converter = converter

        hostRefSeconds = AVAudioTime.seconds(forHostTime: mach_absolute_time())
        wallRefMs = Date().timeIntervalSince1970 * 1000

        input.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, when in
            guard let self, let copy = ArcodaRecorder.copy(buffer) else { return }
            let hostSeconds = when.isHostTimeValid
                ? AVAudioTime.seconds(forHostTime: when.hostTime)
                : Double.nan
            self.queue.async { self.consume(copy, hostSeconds: hostSeconds) }
        }

        do {
            engine.prepare()
            try engine.start()
        } catch {
            input.removeTap(onBus: 0)
            throw ArcodaRecorderError.engineFailed(error.localizedDescription)
        }
    }

    // MARK: - 取り込み

    private func consume(_ buffer: AVAudioPCMBuffer, hostSeconds: Double) {
        guard state == .starting || state == .recording else { return }

        if state == .starting {
            // 「最初のサンプルが実際にマイクから出た時刻」を壁時計に写像して返す。
            // テンポガイドの開始時刻と突き合わせてタイミング採点の同期を取るため、
            // engine.start() の時刻ではなくこの値を startedAtMs とする。
            startedAtMs = hostSeconds.isNaN
                ? Date().timeIntervalSince1970 * 1000
                : wallRefMs + (hostSeconds - hostRefSeconds) * 1000
            state = .recording
            startTimeoutItem?.cancel()
            startTimeoutItem = nil
            let pending = pendingStart
            pendingStart = nil
            deliverStart(pending, .success(startedAtMs))
        }

        write(buffer)
    }

    private func write(_ buffer: AVAudioPCMBuffer) {
        guard let converter, let file else { return }
        let target = file.processingFormat
        let ratio = target.sampleRate / buffer.format.sampleRate
        let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1024
        guard let out = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: capacity) else { return }

        var consumed = false
        var convertError: NSError?
        let status = converter.convert(to: out, error: &convertError) { _, outStatus in
            if consumed {
                outStatus.pointee = .noDataNow
                return nil
            }
            consumed = true
            outStatus.pointee = .haveData
            return buffer
        }
        if status == .error {
            fail(.writeFailed(convertError?.localizedDescription ?? "変換に失敗しました"))
            return
        }
        guard out.frameLength > 0 else { return }

        do {
            try file.write(from: out)
        } catch {
            // まだ 1 フレームも書けていない FLAC なら、失っているものが無いので
            // WAV に切り替えて続行する (spec §2 のフォールバック)。
            // 変換済みの out をそのまま書き直す (再変換すると同じ入力を
            // 変換器に二度食わせることになる)。
            guard format == "flac", framesWritten == 0, retryAsWav(),
                  let wavFile = self.file, (try? wavFile.write(from: out)) != nil else {
                fail(.writeFailed(error.localizedDescription))
                return
            }
        }

        framesWritten += AVAudioFramePosition(out.frameLength)
        if maxFrames > 0, framesWritten >= maxFrames {
            let ms = durationMs()
            finalize()
            emit(.maxDuration(durationMs: ms))
        }
    }

    // MARK: - ファイル

    private func prepareFile() throws {
        let dir = try ArcodaRecorder.recordingsDirectory()
        let base = "arcoda-\(Int(Date().timeIntervalSince1970 * 1000))-\(UInt32.random(in: 0...UInt32.max))"
        if let flac = try? makeFile(at: dir.appendingPathComponent("\(base).flac"), flac: true) {
            file = flac.0
            fileURL = flac.1
            format = "flac"
            didFallback = false
            return
        }
        // OS 標準 FLAC エンコーダが使えない端末では WAV に落とす。
        // サーバーは audio/wav も受け付ける (spec §3) ので採点まで通る。
        let wav = try makeFile(at: dir.appendingPathComponent("\(base).wav"), flac: false)
        file = wav.0
        fileURL = wav.1
        format = "wav"
        didFallback = true
    }

    private func makeFile(at url: URL, flac: Bool) throws -> (AVAudioFile, URL) {
        var settings: [String: Any] = [
            AVSampleRateKey: targetSampleRate,
            AVNumberOfChannelsKey: 1,
            AVLinearPCMBitDepthKey: 16,
        ]
        if flac {
            settings[AVFormatIDKey] = kAudioFormatFLAC
        } else {
            settings[AVFormatIDKey] = kAudioFormatLinearPCM
            settings[AVLinearPCMIsFloatKey] = false
            settings[AVLinearPCMIsBigEndianKey] = false
            settings[AVLinearPCMIsNonInterleaved] = false
        }
        do {
            let audioFile = try AVAudioFile(forWriting: url,
                                            settings: settings,
                                            commonFormat: .pcmFormatInt16,
                                            interleaved: true)
            return (audioFile, url)
        } catch {
            throw ArcodaRecorderError.writeFailed(error.localizedDescription)
        }
    }

    /// FLAC の初回書き込みに失敗したときだけ呼ばれる。成功したら true。
    private func retryAsWav() -> Bool {
        guard let oldURL = fileURL else { return false }
        file = nil
        try? FileManager.default.removeItem(at: oldURL)
        let wavURL = oldURL.deletingPathExtension().appendingPathExtension("wav")
        guard let made = try? makeFile(at: wavURL, flac: false) else { return false }
        file = made.0
        fileURL = made.1
        format = "wav"
        didFallback = true
        // 出力フォーマットは FLAC/WAV とも 48kHz/16bit/mono で同一のため
        // converter はそのまま使い回せる。
        return true
    }

    static func recordingsDirectory() throws -> URL {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        let dir = caches.appendingPathComponent("ArcodaRecordings", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            do {
                try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            } catch {
                throw ArcodaRecorderError.ioFailed(error.localizedDescription)
            }
        }
        return dir
    }

    /// アップロード後の削除に漏れがあっても端末に溜め続けないための掃除。
    static func purgeStaleRecordings(olderThan seconds: TimeInterval = 24 * 60 * 60) {
        guard let dir = try? recordingsDirectory(),
              let entries = try? FileManager.default.contentsOfDirectory(
                  at: dir, includingPropertiesForKeys: [.contentModificationDateKey]) else { return }
        let limit = Date().addingTimeInterval(-seconds)
        for url in entries {
            let modified = (try? url.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate
            if let modified, modified < limit {
                try? FileManager.default.removeItem(at: url)
            }
        }
    }

    /// 録音ディレクトリ配下のファイルだけを対象にする (パス経由の任意ファイル操作を防ぐ)
    static func resolveManagedFile(path: String) throws -> URL {
        let url = path.hasPrefix("file://") ? URL(fileURLWithPath: URL(string: path)?.path ?? path)
                                            : URL(fileURLWithPath: path)
        let resolved = url.standardizedFileURL.resolvingSymlinksInPath()
        let dir = try recordingsDirectory().standardizedFileURL.resolvingSymlinksInPath()
        guard resolved.deletingLastPathComponent().path == dir.path else {
            throw ArcodaRecorderError.invalidPath
        }
        return resolved
    }

    // MARK: - 確定 / 後始末

    private func finalize() {
        guard state == .starting || state == .recording else { return }
        // start() の Promise が宙に浮かないよう、最初のバッファ前に確定した場合は失敗で解決する
        let pending = pendingStart
        pendingStart = nil
        deliverStart(pending, .failure(ArcodaRecorderError.notRecording))

        let ms = durationMs()
        let url = fileURL
        let usedFormat = format
        let fallback = didFallback
        let route = routeUsed
        let started = startedAtMs
        let hwRate = hardwareSampleRate

        teardown(deleteFile: false)

        if let url {
            let attributes = try? FileManager.default.attributesOfItem(atPath: url.path)
            let bytes = (attributes?[.size] as? NSNumber)?.intValue ?? 0
            finalizedResult = ArcodaRecordingResult(
                url: url,
                durationMs: ms,
                format: usedFormat,
                sampleRate: targetSampleRate,
                channels: 1,
                bytes: bytes,
                routeUsed: route,
                startedAtMs: started,
                hardwareSampleRate: hwRate,
                didFallback: fallback
            )
            state = .finalized
        } else {
            state = .idle
        }
    }

    private func fail(_ error: ArcodaRecorderError) {
        let pending = pendingStart
        pendingStart = nil
        teardown(deleteFile: true)
        deliverStart(pending, .failure(error))
        emit(.failure(code: error.code, message: error.errorDescription ?? "録音に失敗しました"))
    }

    /// エンジンとセッションを止める。`state` は呼び出し側で決める。
    private func teardown(deleteFile: Bool) {
        startTimeoutItem?.cancel()
        startTimeoutItem = nil
        if engine.isRunning || state != .idle {
            engine.inputNode.removeTap(onBus: 0)
        }
        if engine.isRunning { engine.stop() }
        converter = nil
        file = nil  // release = flush & close
        if deleteFile {
            if let fileURL { try? FileManager.default.removeItem(at: fileURL) }
            fileURL = nil
            finalizedResult = nil
            state = .idle
        }
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }

    private func reset() {
        framesWritten = 0
        startedAtMs = 0
        didFallback = false
        format = "flac"
        fileURL = nil
        finalizedResult = nil
    }

    private func durationMs() -> Double {
        targetSampleRate > 0 ? Double(framesWritten) / targetSampleRate * 1000 : 0
    }

    private func deliverStart(_ callback: ((Result<Double, Error>) -> Void)?,
                              _ result: Result<Double, Error>) {
        guard let callback else { return }
        DispatchQueue.main.async { callback(result) }
    }

    private func emit(_ event: ArcodaRecorderEvent) {
        DispatchQueue.main.async { [weak self] in self?.onEvent?(event) }
    }

    // MARK: - 割り込み

    private func registerObservers() {
        let center = NotificationCenter.default
        center.addObserver(self,
                           selector: #selector(handleInterruption(_:)),
                           name: AVAudioSession.interruptionNotification,
                           object: nil)
        center.addObserver(self,
                           selector: #selector(handleRouteChange(_:)),
                           name: AVAudioSession.routeChangeNotification,
                           object: nil)
        center.addObserver(self,
                           selector: #selector(handleMediaServicesReset(_:)),
                           name: AVAudioSession.mediaServicesWereResetNotification,
                           object: nil)
    }

    @objc private func handleInterruption(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }

        if type == .began {
            // 電話・アラーム等。自動再開はせず、ここまでを確定して
            // 「保存 / 破棄」の判断は Recorder 側の UI に委ねる (spec §2)。
            queue.async {
                guard self.state == .starting || self.state == .recording else { return }
                self.finalize()
                self.emit(.interruption(began: true, shouldResume: false))
            }
            return
        }

        let options = (note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt).map {
            AVAudioSession.InterruptionOptions(rawValue: $0)
        }
        emit(.interruption(began: false, shouldResume: options?.contains(.shouldResume) ?? false))
    }

    @objc private func handleRouteChange(_ note: Notification) {
        let route = ArcodaRecorder.describeRoute(AVAudioSession.sharedInstance().currentRoute)
        queue.async {
            if self.state == .recording || self.state == .starting {
                self.routeUsed = route
            }
        }
        emit(.routeChange(route: route))
    }

    @objc private func handleMediaServicesReset(_ note: Notification) {
        queue.async {
            guard self.state == .starting || self.state == .recording else { return }
            self.fail(.engineFailed("オーディオ機能がリセットされました"))
        }
    }

    // MARK: - ユーティリティ

    static func describeRoute(_ route: AVAudioSessionRouteDescription) -> String {
        let inputs = route.inputs.map { "\($0.portType.rawValue):\($0.portName)" }
        let outputs = route.outputs.map { "\($0.portType.rawValue):\($0.portName)" }
        let inPart = inputs.isEmpty ? "none" : inputs.joined(separator: ",")
        let outPart = outputs.isEmpty ? "none" : outputs.joined(separator: ",")
        return "in=\(inPart) out=\(outPart)"
    }

    /// タップのバッファはコールバックを抜けると無効になるので複製する。
    /// AudioBufferList 経由で丸ごと写すので、float / int16・インターリーブ有無を問わない。
    private static func copy(_ buffer: AVAudioPCMBuffer) -> AVAudioPCMBuffer? {
        guard buffer.frameLength > 0,
              let copy = AVAudioPCMBuffer(pcmFormat: buffer.format,
                                          frameCapacity: buffer.frameLength) else { return nil }
        copy.frameLength = buffer.frameLength

        let source = UnsafeMutableAudioBufferListPointer(
            UnsafeMutablePointer(mutating: buffer.audioBufferList))
        let destination = UnsafeMutableAudioBufferListPointer(copy.mutableAudioBufferList)
        guard source.count == destination.count else { return nil }
        for index in 0..<source.count {
            guard let src = source[index].mData, let dst = destination[index].mData else { return nil }
            let bytes = min(source[index].mDataByteSize, destination[index].mDataByteSize)
            memcpy(dst, src, Int(bytes))
        }
        return copy
    }
}

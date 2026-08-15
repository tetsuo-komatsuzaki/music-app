import Capacitor
import Foundation
import UIKit

/// ARC-SPEC-NATIVE-1.0 §2 — WebView (arcodaviolin.com) から呼ばれる橋渡し層。
/// 実際の録音処理は `ArcodaRecorder` にあり、ここは引数検証と
/// JS へ返す辞書の組み立てだけを行う。
@objc(ArcodaRecorderPlugin)
public class ArcodaRecorderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ArcodaRecorderPlugin"
    public let jsName = "ArcodaRecorder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readChunk", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteFile", returnType: CAPPluginReturnPromise),
    ]

    /// readChunk 1 回あたりの上限。64MB のファイルでも WebView の
    /// メモリを一気に食わないよう分割読みを前提にする。
    private static let maxChunkBytes = 4 * 1024 * 1024
    private static let defaultChunkBytes = 2 * 1024 * 1024

    private let recorder = ArcodaRecorder()

    override public func load() {
        ArcodaRecorder.purgeStaleRecordings()
        recorder.onEvent = { [weak self] event in
            guard let self else { return }
            switch event {
            case .interruption(let began, let shouldResume):
                self.notifyListeners("interruption", data: [
                    "type": began ? "began" : "ended",
                    "shouldResume": shouldResume,
                ])
            case .routeChange(let route):
                self.notifyListeners("routeChange", data: ["routeUsed": route])
            case .maxDuration(let durationMs):
                self.notifyListeners("maxDuration", data: ["durationMs": durationMs])
            case .failure(let code, let message):
                self.notifyListeners("recordingError", data: ["code": code, "message": message])
            }
        }
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "platform": "ios",
            "osVersion": UIDevice.current.systemVersion,
        ])
    }

    @objc func checkPermission(_ call: CAPPluginCall) {
        call.resolve([
            "granted": ArcodaRecorder.permissionGranted(),
            "status": ArcodaRecorder.permissionStatus(),
        ])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        ArcodaRecorder.requestPermission { granted in
            call.resolve([
                "granted": granted,
                "status": ArcodaRecorder.permissionStatus(),
            ])
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        let sampleRate = call.getDouble("sampleRate")
        let maxDurationSec = call.getDouble("maxDurationSec")
        recorder.start(sampleRate: sampleRate, maxDurationSec: maxDurationSec) { result in
            switch result {
            case .success(let startedAtMs):
                call.resolve([
                    "startedAtMs": startedAtMs,
                    "sampleRate": sampleRate ?? ArcodaRecorder.defaultSampleRate,
                ])
            case .failure(let error):
                self.reject(call, error)
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        recorder.stop { result in
            switch result {
            case .success(let recording):
                var data: [String: Any] = [
                    "path": recording.url.path,
                    "uri": recording.url.absoluteString,
                    "durationMs": recording.durationMs,
                    "format": recording.format,
                    "mimeType": recording.format == "flac" ? "audio/flac" : "audio/wav",
                    "sampleRate": recording.sampleRate,
                    "channels": recording.channels,
                    "bytes": recording.bytes,
                    "routeUsed": recording.routeUsed,
                    "startedAtMs": recording.startedAtMs,
                    "hardwareSampleRate": recording.hardwareSampleRate,
                    "didFallback": recording.didFallback,
                ]
                // プレビュー再生用の WebView から辿れる URL (取得できない環境もある)
                if let webURL = self.bridge?.portablePath(fromLocalURL: recording.url) {
                    data["webPath"] = webURL.absoluteString
                }
                call.resolve(data)
            case .failure(let error):
                self.reject(call, error)
            }
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        recorder.cancel { call.resolve() }
    }

    /// 録音ファイルを base64 で分割読みする。
    /// Capacitor Filesystem を使わないのは、64MB のファイルを一括 base64 化させず
    /// JS 側で Blob を継ぎ足して組み立てられるようにするため。
    @objc func readChunk(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.reject("path is required", ArcodaRecorderError.invalidPath.code)
            return
        }
        let offset = max(0, call.getInt("offset") ?? 0)
        let requested = call.getInt("length") ?? ArcodaRecorderPlugin.defaultChunkBytes
        let length = min(max(1, requested), ArcodaRecorderPlugin.maxChunkBytes)

        do {
            let url = try ArcodaRecorder.resolveManagedFile(path: path)
            let handle = try FileHandle(forReadingFrom: url)
            defer { try? handle.close() }

            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            let total = (attributes[.size] as? NSNumber)?.intValue ?? 0

            try handle.seek(toOffset: UInt64(offset))
            let data = try handle.read(upToCount: length) ?? Data()
            call.resolve([
                "data": data.base64EncodedString(),
                "bytesRead": data.count,
                "totalBytes": total,
                "eof": offset + data.count >= total,
            ])
        } catch let error as ArcodaRecorderError {
            reject(call, error)
        } catch {
            call.reject(error.localizedDescription, ArcodaRecorderError.ioFailed("").code, error)
        }
    }

    /// アップロード成功後にローカルの録音を消す (spec §2)。
    @objc func deleteFile(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.reject("path is required", ArcodaRecorderError.invalidPath.code)
            return
        }
        do {
            let url = try ArcodaRecorder.resolveManagedFile(path: path)
            if FileManager.default.fileExists(atPath: url.path) {
                try FileManager.default.removeItem(at: url)
            }
            call.resolve(["deleted": true])
        } catch let error as ArcodaRecorderError {
            reject(call, error)
        } catch {
            call.reject(error.localizedDescription, ArcodaRecorderError.ioFailed("").code, error)
        }
    }

    private func reject(_ call: CAPPluginCall, _ error: Error) {
        let recorderError = error as? ArcodaRecorderError
        call.reject(recorderError?.errorDescription ?? error.localizedDescription,
                    recorderError?.code ?? "UNKNOWN",
                    error)
    }
}

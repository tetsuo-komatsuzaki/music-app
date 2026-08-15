// swift-tools-version: 5.9
import PackageDescription

// Capacitor 8 の iOS 連携は SPM が既定 (CocoaPods 不要)。
// パッケージ名 / product 名は Capacitor CLI が package.json の名前から
// 導出する "ArcodaRecorder" と一致させる必要がある。
let package = Package(
    name: "ArcodaRecorder",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "ArcodaRecorder",
            targets: ["ArcodaRecorderPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "ArcodaRecorderPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/ArcodaRecorderPlugin")
    ]
)

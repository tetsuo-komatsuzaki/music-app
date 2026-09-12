// swift-tools-version: 5.9
import PackageDescription

// Capacitor 8 の iOS 連携は SPM が既定 (arcoda-recorder と同じ作法)。
// パッケージ名 / product 名は package.json の名前から導出される "ArcodaStore" と一致させる。
let package = Package(
    name: "ArcodaStore",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "ArcodaStore",
            targets: ["ArcodaStorePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "ArcodaStorePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/ArcodaStorePlugin")
    ]
)

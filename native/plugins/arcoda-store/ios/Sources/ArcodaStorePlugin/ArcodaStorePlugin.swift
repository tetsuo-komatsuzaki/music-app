import Capacitor
import Foundation
import StoreKit
import UIKit

/// ArcodaStore — StoreKit 2 のブリッジ (2026-09-12 要件整理 v2.7 §5 N-2)。
/// WebView (arcodaviolin.com) から window.Capacitor.nativePromise("ArcodaStore", method, options) で呼ばれる。
/// 価格・期間・導入オファーの対象かは Apple から取った値をそのまま返す (JS 側に数字は書かない)。
/// 購入には appAccountToken (= supabaseUserId の UUID) を添える。Apple の通知にこの値が入って返り、サーバーが持ち主を決める。
@objc(ArcodaStorePlugin)
public class ArcodaStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ArcodaStorePlugin"
    public let jsName = "ArcodaStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deviceKey", returnType: CAPPluginReturnPromise),
    ]

    private var updatesTask: Task<Void, Never>?

    override public func load() {
        // 購入の完了・更新を取りこぼさないよう、Transaction.updates を監視して finish する。
        // 反映はサーバー (App Store Server Notifications) が正なので、ここでは finish だけ行う。
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let tx) = result {
                    await tx.finish()
                    _ = self
                }
            }
        }
    }

    deinit { updatesTask?.cancel() }

    // MARK: - getProducts

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? []
        guard !ids.isEmpty else { call.reject("productIds が空です"); return }
        Task {
            do {
                let products = try await Product.products(for: ids)
                var out: [[String: Any]] = []
                for p in products {
                    var intro = false
                    var period = ""
                    if let sub = p.subscription {
                        intro = await sub.isEligibleForIntroOffer
                        period = Self.isoPeriod(sub.subscriptionPeriod)
                    }
                    out.append([
                        "productId": p.id,
                        "displayPrice": p.displayPrice,
                        "introEligible": intro,
                        "period": period,
                        "price": NSDecimalNumber(decimal: p.price).doubleValue,
                        "currencyCode": p.priceFormatStyle.currencyCode,
                    ])
                }
                call.resolve(["products": out])
            } catch {
                call.reject("商品情報を取得できませんでした: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - purchase

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else { call.reject("productId が要ります"); return }
        guard let tokenStr = call.getString("appAccountToken"), let token = UUID(uuidString: tokenStr) else {
            call.reject("appAccountToken は UUID で渡してください"); return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.resolve(["status": "error", "message": "商品が見つかりません"]); return
                }
                let result = try await product.purchase(options: [.appAccountToken(token)])
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let tx):
                        await tx.finish()
                        call.resolve([
                            "status": "ok",
                            "jws": verification.jwsRepresentation,
                            "productId": tx.productID,
                            "originalTransactionId": String(tx.originalID),
                        ])
                    case .unverified(_, let err):
                        call.resolve(["status": "error", "message": "検証できませんでした: \(err.localizedDescription)"])
                    }
                case .userCancelled:
                    call.resolve(["status": "cancel"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.resolve(["status": "error", "message": "不明な結果です"])
                }
            } catch {
                call.resolve(["status": "error", "message": error.localizedDescription])
            }
        }
    }

    // MARK: - restore

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
            } catch {
                // sync に失敗しても currentEntitlements は読めることが多いので続ける
            }
            var list: [[String: String]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let tx) = result {
                    list.append(["jws": result.jwsRepresentation, "productId": tx.productID])
                }
            }
            if list.isEmpty {
                call.resolve(["status": "none"])
            } else {
                call.resolve(["status": "ok", "transactions": list])
            }
        }
    }

    // MARK: - manageSubscriptions

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else {
                call.reject("画面が見つかりません"); return
            }
            do {
                try await AppStore.showManageSubscriptions(in: scene)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    // MARK: - deviceKey

    @objc func deviceKey(_ call: CAPPluginCall) {
        let key = UIDevice.current.identifierForVendor?.uuidString ?? ""
        call.resolve(["key": key])
    }

    // MARK: - helpers

    private static func isoPeriod(_ p: Product.SubscriptionPeriod) -> String {
        switch p.unit {
        case .day: return "P\(p.value)D"
        case .week: return "P\(p.value)W"
        case .month: return "P\(p.value)M"
        case .year: return "P\(p.value)Y"
        @unknown default: return ""
        }
    }
}

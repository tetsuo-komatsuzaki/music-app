# 課金の法務文面 ― 計画と適用範囲の棚卸し

## 成果物
| 種別 | パス | 状態 |
|---|---|---|
| 利用規約 | app/components/legal/TermsContent.tsx | 改定案 (課金条項・ゲスト・Apple 条項) |
| プライバシーポリシー | app/components/legal/PrivacyContent.tsx | 改定案 (Apple・契約情報・お便り・ゲスト・Google Cloud) |
| 特商法 | app/components/legal/TokushohoContent.tsx、app/tokushoho/page.tsx、app/[userId]/support/tokushoho/page.tsx | 新設 |
| App Store 文 | docs/legal/app-store-listing.md | 新設 |

## 到達経路 (R5)
| 画面 | 規約 | ポリシー | 特商法 | 対応 |
|---|---|---|---|---|
| /start (契約画面) | あり | あり | あり | 既存 + 特商法追加 |
| /signUp (Web 登録) | 同意チェック | 同意チェック | 不要 (購入なし) | 既存 |
| /login (Apple・Google) | なし → 追加 | なし → 追加 | 不要 | 同意の一文を追加 |
| サポート一覧 | あり | あり | なし → 追加 | メニュー項目追加 |
| 設定 → プラン | 「契約を管理」 | — | — | 既存 |
| ヘルプ FAQ | 参照文を追加 | — | 参照文を追加 | 料金 FAQ 3 件追加・退会 FAQ 追記 |
| App Store Connect | EULA URL | ポリシー URL | 説明文に URL | listing.md |
| LP (public/lp) | なし | 待機リスト用の簡易ポリシー | なし | 変更せず・報告で指摘 (運営者名を既に表示している) |

## 文面と実装の突き合わせ (R4)
| 文面の主張 | 実装 | 判定 |
|---|---|---|
| ゲストの記録は 30 日で削除 | GUEST_RETENTION_DAYS=30・cron guest-cleanup が Storage・Performance・Auth ごと削除 | 一致 |
| 端末識別子 = iOS は identifierForVendor・Web は乱数 | deviceKey.ts | 一致 |
| 退会で Apple トークン失効 | requestAccountDeletion → revokeAppleToken | 一致 |
| 退会しても Apple の契約は止まらない | 退会モーダル・完了メール (apple の人に追記)・FAQ・規約第13条・特商法 | 一致 |
| Web の契約は退会と同時に解約 | 実装なし → requestAccountDeletion に Stripe cancel を追加 | 修正 |
| お知らせメールは設定画面で停止できる | 実装なし → 設定に「お知らせメール」スイッチ + setMarketingOff を追加 | 修正 |
| Apple 通知は原文保管・退会後は個人と結びつけない | AppleNotification は退会でも残る (appAccountToken は孤立 id) | 文面を実態に合わせて修正 |
| 退会時に Storage と DB を即時削除 | cleanupStorage + cascade | 一致 |
| 契約切れでも記録は閲覧可 | 決定表・レイアウトのゲート | 一致 |
| 契約なし・契約切れは録音不可 (規約 第5条・第5条の4) | plan.ts REQUIRE_SUBSCRIPTION。Stripe モードは false・apple モードで自動 true (R2 fix)。切替前に planGrant=internal | 修正 |
| App Store のサポート URL /support/help が開く | app/support/help/page.tsx → /guest/support/help へ redirect (R2 fix) | 修正 |
| 無料期間 Apple ID ごと 1 回 | StoreKit の introductory offer eligibility | 一致 |
| Stripe 契約者を提供元 stripe として扱う | billingProviderOf.resolveBillingProvider + webhook で書く + バックフィル migration (R3 fix) | 修正 |

## ラウンド
- R1: 批評家が文面 4 本を法的観点で批評 (03_round-1-critic.md)。
- R1 fix: 批評への対応 + 上表の修正 (04_round-1-fix.md)。
- R2: 批評家が「漏れ」と「正確さ」を判定 (到達経路・適用範囲・実装との一致)。→ 不合格 S2 3 件 → 04_round-2-fix.md
- R3: R2 の閉じ確認と新規探索。→ 不合格 S2 1 件 (Stripe の billingProvider が書かれず解約分岐が到達不能) → 04_round-3-fix.md
- R4: R3 の閉じ確認と新規探索。→ 条件つき合格 (S3 6・S4 3) → 04_round-4-fix.md
- R5: R4 の閉じ確認と新規探索。→ 条件つき合格 (S3 6・S4 5) → 04_round-5-fix.md
- 合格条件: S1/S2 ゼロ、【 】以外の未定なし。

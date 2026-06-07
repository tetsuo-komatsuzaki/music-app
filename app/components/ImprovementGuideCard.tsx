// app/components/ImprovementGuideCard.tsx
//
// UI 設計書 v3 §5-6 / §5-12 / v3.1 §15-2 (F2) — 改善アドバイスカード
//
// 表示制御:
//   - improvementGuides 配列を順番にレンダリング (UI 側では絞り込まない)
//   - 各 ImprovementGuideEntry を 1 カード化
//   - 1 カード内に awareness / practice / etudeRecommendation を縦並びで常時展開
//   - improvementGuides が空なら祝福メッセージを表示
//
// 「この教材で練習する」ボタン (UI-13 / F2 / UI-12 §8):
//   - cardId + userId が揃っていればクリック可。
//   - 遷移先: /{userId}/practice?fromCard={cardId}&context=etude
//     → /practice 画面が「{subTaskName} の教材」コンテクストとレコメンド一覧を表示
//   - 旧実装は ?limit=1 で先頭 practiceItem に直接遷移していたが、
//     UI-12 §8 (D3) で list 表示に変更。ユーザーが選べるようにする。
//   - cardId が null または userId が未提供なら「準備中」disabled

"use client"

import Link from "next/link"
import type {
  ImprovementGuideEntry,
  ImprovementMethod,
  ProblematicPosition,
} from "./PerformanceSkillDetail"
import styles from "./ImprovementGuideCard.module.css"

type Props = {
  guides: ImprovementGuideEntry[]
  /** 気になる箇所。各 sub_task に対応する位置を該当ガイド内に表示する
   *  (旧 ProblematicPositionList の候補選択 UI は廃止、2026-06-08)。 */
  positions?: ProblematicPosition[]
  /** 該当箇所タップで譜面ジャンプ + ハイライト。未提供なら非クリック表示。 */
  onJumpToPosition?: (noteIndices: number[]) => void
  /** UI-13: 教材ボタン押下時の navigation 用 supabaseUserId。
   *  未提供時はボタン無効化。 */
  userId?: string
}

/** 「第 X 小節 Y 拍目」形式の位置文字列 (旧 ProblematicPositionList から踏襲)。 */
function formatPosition(p: ProblematicPosition): string {
  const { measure_start, beat_start, measure_end, beat_end } = p
  if (measure_start === measure_end && beat_start === beat_end) {
    return `第 ${measure_start} 小節 ${beat_start} 拍目`
  }
  if (measure_start === measure_end) {
    return `第 ${measure_start} 小節 ${beat_start}〜${beat_end} 拍目`
  }
  return `第 ${measure_start} 小節 ${beat_start} 拍目〜第 ${measure_end} 小節 ${beat_end} 拍目`
}

function MethodSection({
  icon,
  label,
  method,
}: {
  icon: string
  label: string
  method: ImprovementMethod
}) {
  const hasSteps = Array.isArray(method.steps) && method.steps.length > 0
  return (
    <section className={styles.methodSection}>
      <h4 className={styles.methodHeading}>
        <span className={styles.methodIcon} aria-hidden="true">
          {icon}
        </span>
        {label}
      </h4>
      <div className={styles.methodTitle}>{method.title}</div>
      {hasSteps ? (
        <ol className={styles.methodSteps}>
          {method.steps!.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      ) : (
        <p className={styles.methodDescription}>{method.description}</p>
      )}
    </section>
  )
}

function GuideCard({
  entry,
  positions,
  onJumpToPosition,
  userId,
}: {
  entry: ImprovementGuideEntry
  positions: ProblematicPosition[]
  onJumpToPosition?: (noteIndices: number[]) => void
  userId?: string
}) {
  const { guide } = entry
  const practiceLabel =
    guide.practice.durationMinutes != null
      ? `練習方法（${guide.practice.durationMinutes}分）`
      : "練習方法"

  const canNavigate = !!entry.cardId && !!userId
  const etudeHref = canNavigate
    ? `/${userId}/practice?fromCard=${entry.cardId}&context=etude`
    : null

  // この sub_task に該当する気になる箇所 (候補にこの sub_task を含む位置)
  const matchedPositions = positions.filter((p) =>
    p.candidate_sub_task_ids.includes(entry.subTaskId),
  )

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.parentTaskBadge}>{entry.parentTaskName}</span>
        <h3 className={styles.subTaskName}>{entry.subTaskName}</h3>
      </header>

      {/* 該当箇所 (旧「気になる箇所」の候補選択 UI を廃止し、ここに位置のみ表示) */}
      {matchedPositions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>該当箇所:</span>
          {matchedPositions.map((pos) =>
            onJumpToPosition ? (
              <button
                key={pos.position_id}
                type="button"
                onClick={() => onJumpToPosition(pos.note_indices)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 14,
                  border: "1px solid #d4a373",
                  background: "#fff7ee",
                  color: "#b5651d",
                  cursor: "pointer",
                }}
                title="譜面で該当箇所を表示"
              >
                {formatPosition(pos)} 🎯
              </button>
            ) : (
              <span
                key={pos.position_id}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 14,
                  background: "#f4f4f4",
                  color: "#555",
                }}
              >
                {formatPosition(pos)}
              </span>
            ),
          )}
        </div>
      )}

      <MethodSection icon="🎯" label="意識する" method={guide.awareness} />
      <MethodSection icon="🎵" label={practiceLabel} method={guide.practice} />
      <MethodSection
        icon="📚"
        label="おすすめ教材"
        method={guide.etudeRecommendation}
      />

      <div className={styles.etudeButtonRow}>
        {etudeHref ? (
          <Link
            href={etudeHref}
            className={styles.etudeButton}
            title="おすすめ教材ページに移動します"
          >
            この教材で練習する
          </Link>
        ) : (
          <button
            type="button"
            className={styles.etudeButton}
            disabled
            aria-disabled="true"
            title="教材レコメンドの準備中です"
          >
            この教材で練習する（準備中）
          </button>
        )}
      </div>
    </article>
  )
}

export default function ImprovementGuideCard({
  guides,
  positions = [],
  onJumpToPosition,
  userId,
}: Props) {
  if (guides.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        素晴らしい演奏でした！次のチャレンジに進みましょう
      </div>
    )
  }
  return (
    <div className={styles.list}>
      {guides.map(entry => (
        <GuideCard
          key={entry.subTaskId}
          entry={entry}
          positions={positions}
          onJumpToPosition={onJumpToPosition}
          userId={userId}
        />
      ))}
    </div>
  )
}

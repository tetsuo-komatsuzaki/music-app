// app/_libs/arcoChan.ts
//
// アルコちゃん (バイオリン練習アプリの AI コーチ) の挨拶メッセージ生成。
// MVP は静的テンプレート分岐 (LLM 不使用)。
// データ引用は事実ベース、トーンはややフレンドリー。

export type ArcoContext = {
  userName: string
  streak: number                       // 連続練習日数
  weeklyDays: number                   // 今週の練習日数
  lastPracticeDate: Date | null        // 最後に練習した日 (なければ初回)
  lastOverallScore: number | null      // 直近演奏の総合スコア (null=未計測)
  previousOverallScore: number | null  // 前々回演奏の総合スコア (改善検出用)
}

export type ArcoMessage = {
  greeting: string  // 1行目: 挨拶
  cheer: string     // 2行目: 状況に応じたチアアップ or 事実引用
}

const DAY_MS = 86400000
const SCORE_IMPROVEMENT_THRESHOLD = 3  // +3点以上で「改善」とみなす

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS)
}

export function generateArcoMessage(ctx: ArcoContext): ArcoMessage {
  const { userName, streak, weeklyDays, lastPracticeDate, lastOverallScore, previousOverallScore } = ctx
  const greeting = `こんにちは、${userName}さん！`

  // ── 初回ユーザー ──
  if (!lastPracticeDate) {
    return {
      greeting: `はじめまして、${userName}さん！`,
      cheer: "ようこそ！ まずは1曲、好きな楽譜をアップロードして練習を始めてみましょう。",
    }
  }

  const daysSince = daysBetween(lastPracticeDate, new Date())

  // ── 久しぶり (3日以上空いた、streak は 0 になっている) ──
  if (streak === 0 && daysSince >= 3) {
    return {
      greeting,
      cheer: `お久しぶりです（${daysSince}日ぶり）。今日が再スタートの日です。短時間でもいいので始めましょう！`,
    }
  }

  // ── 2日空いた (streak が途切れて2日経過) ──
  if (streak === 0 && daysSince === 2) {
    return {
      greeting,
      cheer: "2日間お休みでしたね。今日からまた続けていきましょう。",
    }
  }

  // ── 改善検出 (連続練習中で直近スコアが向上) ──
  // streak >= 1 のみで判定 (途切れた直後は称賛しない)
  if (
    streak >= 1 &&
    lastOverallScore != null &&
    previousOverallScore != null &&
    lastOverallScore - previousOverallScore >= SCORE_IMPROVEMENT_THRESHOLD
  ) {
    const delta = Math.round(lastOverallScore - previousOverallScore)
    return {
      greeting,
      cheer: `前回の演奏より総合スコアが +${delta}点 改善しています！この調子で続けましょう 🔥`,
    }
  }

  // ── 昨日練習 (streak=1 で最終練習が昨日 = 今日まだ未練習) ──
  if (streak === 1 && daysSince === 1) {
    return {
      greeting,
      cheer: "昨日の練習、お疲れさまでした。今日もリズムを崩さず続けましょう。",
    }
  }

  // ── 長期継続 (30日以上) ──
  if (streak >= 30) {
    return {
      greeting,
      cheer: `${streak}日連続！驚異的な継続力です 🌟 今日も自分のペースで練習しましょう。`,
    }
  }

  // ── 中期継続 (14〜29日) ──
  if (streak >= 14) {
    return {
      greeting,
      cheer: `${streak}日連続。練習が習慣として定着していますね。今週は ${weeklyDays}日 練習できています。`,
    }
  }

  // ── 短期継続 (7〜13日) ──
  if (streak >= 7) {
    return {
      greeting,
      cheer: `${streak}日連続で練習できています、素晴らしいペースです 🔥`,
    }
  }

  // ── ごく短期継続 (3〜6日) ──
  if (streak >= 3) {
    return {
      greeting,
      cheer: `${streak}日連続！リズムが作れてきていますね。今日も無理のない範囲で続けましょう。`,
    }
  }

  // ── 今日が初日 (streak=1 daysSince=0) または 2日連続 ──
  if (streak === 1 && daysSince === 0) {
    return {
      greeting,
      cheer: "今日も練習を始めました！継続が力になります。",
    }
  }
  if (streak === 2) {
    return {
      greeting,
      cheer: "2日連続！リズムが作れてきています。今日も続けましょう。",
    }
  }

  // ── フォールバック ──
  return {
    greeting,
    cheer: "今日も練習を始めましょう。",
  }
}

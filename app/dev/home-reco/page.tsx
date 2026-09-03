// ホーム「あなた専用のおすすめ練習」の実装確認用プレビュー (2026-09-03)。
// おすすめエンジンを当てる前の「画面だけ」の段階なので、実コンポーネントに
// 本番と同じ形の値を流して、埋まった状態と空の状態を並べる。
// エンジン接続が済んだら消してよい一時ルート。
import PersonalRecoCard, { type PersonalReco } from "@/app/components/PersonalRecoCard"

export const metadata = { title: "おすすめ練習 実装プレビュー" }

const UID = "preview"

// 4分類すべてが埋まった状態。課題名と成功率は実ユーザーの累積カウンタから出た値
const FULL: PersonalReco = {
  tabs: [
    {
      key: "pitch",
      focus: { name: "同じ弦で高い音へ大きく跳ぶ", successPct: 51 },
      materials: [
        { id: "m1", title: "アルペジオ 2オクターブ", category: "arpeggio", star: 2, keyTonic: "G", keyMode: "major" },
        { id: "m2", title: "音階 2オクターブ", category: "scale", star: 2, keyTonic: "D", keyMode: "major" },
      ],
      basics: false,
    },
    {
      key: "position",
      focus: { name: "左手を第2から第3ポジションへ移す", successPct: 95 },
      materials: [],
      basics: false,
    },
    {
      key: "technique",
      focus: { name: "スラーの中で音を変える", successPct: 68 },
      materials: [
        { id: "m3", title: "ボーイング スラー4音", category: "bowing", star: 2, keyTonic: "A", keyMode: "major" },
      ],
      basics: false,
    },
    {
      key: "fingering",
      focus: { name: "指を切り替える時間が短い音", successPct: 74 },
      materials: [
        { id: "m4", title: "フィンガリング 1-2-3-4 連続", category: "fingering", star: 2, keyTonic: "G", keyMode: "major" },
        { id: "m5", title: "エチュード カイザー No.1", category: "etude", star: 3, keyTonic: "C", keyMode: "major" },
      ],
      basics: false,
    },
  ],
}

// 判定できる音がまだ足りない状態
const EMPTY: PersonalReco = {
  tabs: (["pitch", "position", "technique", "fingering"] as const).map((key) => ({
    key,
    focus: null,
    materials: [],
    basics: false,
  })),
}

const wrap: React.CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "24px 18px 80px" }
const h: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, letterSpacing: ".16em",
  color: "var(--text-muted)", margin: "26px 0 0",
}

export default function Page() {
  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>あなた専用のおすすめ練習</h1>
      <p style={{ fontSize: 12.5, color: "var(--text-sub)", margin: "6px 0 0" }}>
        ホームに新設する枠の実装。おすすめロジックはこのあと当てる
      </p>

      <h2 style={h}>中身が入った状態</h2>
      <PersonalRecoCard userId={UID} reco={FULL} />

      <h2 style={h}>判定できる音が足りない状態</h2>
      <PersonalRecoCard userId={UID} reco={EMPTY} />
    </div>
  )
}

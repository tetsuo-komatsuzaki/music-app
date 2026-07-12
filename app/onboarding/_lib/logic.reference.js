// arcoda_onboarding_logic.js — ★判定ラダー + 仮習得一括付与(§27-3 / §27-4 / §27-4-3 準拠)
// ブラウザ・Node 両対応(検証証跡用)

// 2026-07-14 用語改定(Tetsuo指示・logic.tsと同時更新):
// モルデント→プラルトリラーとモルデント / ボウ・スタッカート→連続スタッカート
const BANDS = {
  1: ['スラー', 'ピチカート'],
  2: ['スタッカート', 'スピッカート', 'トリル', 'プラルトリラーとモルデント'],
  3: ['ビブラート', 'ポルタート', 'トレモロ'],
  4: ['グリッサンド', 'ナチュラル・ハーモニクス'], // ポジションは個別付与(§27-4-3)
  5: ['連続スタッカート', 'リコシェ'],
  6: [], // ポジション6th以上は個別付与
};

const POSITION_TAG = {
  '2nd': 'ポジション(2nd)', '3rd': 'ポジション移動(3rd)', '4th': 'ポジション(4th)',
  '5th': 'ポジション(5th)', '6th+': 'ポジション(6th以上)',
};

// ★判定+一括付与。
// 入力: { beginner, g1, g2:[トリル|スタッカート|スピッカート], g3, g3sup, g4:[2nd|3rd|4th|5th|6th+], g5 }
// 出力: { star, tags:[技術タグ名], doubleStops:[音程種別], notes:[] }
// ※ 帯一括付与ルール【確定 2026-07-11】: 「確定★の1つ下の帯まで(1..star-1)+個別聴取分」。
//    §27-4-3原文「未満(当該★を含む)」は誤記としてTetsuo承認のもと本解釈で確定。
//    (原文通りだとG3落ち=ビブラート不可の申告者にビブラートを仮習得付与する矛盾が生じるため)
function judge(a) {
  const notes = [];
  let star, tags = new Set(), doubleStops = [];

  if (a.beginner) {
    star = 1; // これから始める → ★1確定・ラダースキップ(§27-2)
  } else if (!a.g1) {
    star = 1; // G1落ち
  } else if ((a.g2 || []).length < 3) {
    star = 2; // G2: 1つでも欠け→★2、選択分は仮習得(§27-3)
    (a.g2 || []).forEach(t => tags.add(t));
    if ((a.g2 || []).includes('トリル')) tags.add('プラルトリラーとモルデント'); // トリルの短縮形として同帯(§27-4)
  } else if (!a.g3) {
    star = 3; // G3落ち
    if (a.g3sup) { tags.add(POSITION_TAG['3rd']); notes.push('補足質問: 移動可→ポジションフラグのみ付与(★判定に不使用)'); }
  } else {
    const g4 = a.g4 || [];
    const has = p => g4.includes(p);
    if (g4.length === 0) {
      star = 4; // 移動不可→★4確定
    } else if (!has('2nd') && !has('4th') && !has('5th') && !has('6th+')) {
      star = 4; // 3rdまで→★4確定
    } else {
      star = a.g5 ? 6 : 5; // G5: 重音可→★6(上限)/不可→★5
    }
    g4.forEach(p => tags.add(POSITION_TAG[p])); // ポジションは選択分のみ付与(一括付与しない)
    if (star === 6) doubleStops = ['3度', '6度']; // G5通過者のみ。4度/5度/オクターブ以上は通常フロー(§27-4-3)
  }

  // 帯一括付与: 1 .. star-1(解釈A)
  for (let b = 1; b < star; b++) BANDS[b].forEach(t => tags.add(t));

  return { star, tags: [...tags], doubleStops, notes };
}

// 全フラグは PROVISIONAL で書き込む(§27-5)
function toProvisionalFlags(result) {
  return [
    ...result.tags.map(t => ({ tag: t, state: 'PROVISIONAL' })),
    ...result.doubleStops.map(d => ({ tag: `重音(${d})`, state: 'PROVISIONAL' })),
  ];
}

// ============================================================
// 到達予測ロジック v2(2026-07-11): ★差 × 練習時間 → 習得期間
// 全パラメータは暫定値(Tetsuoの教育的キャリブレーション対象)
// ============================================================
const PREDICTION_PARAMS = {
  // 曲仕上げの基礎週数(達成フェーズ到達まで、1日15分基準)
  songBaseWeeks: { 1: 2, 2: 4, 3: 6, 4: 9, 5: 13, 6: 18, 7: 24 },
  // ★を1段登るのに必要な週数(k段目に登る重み。上位ほど重い)
  climbWeeks:    { 2: 3, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12 },
  // 練習時間係数(15分/日 = 1.0 基準。逓減モデル: 時間6倍でも速度6倍にはならない)
  timeFactor:    { '5分 / 日': 1.6, '15分 / 日': 1.0, '30分 / 日': 0.75, 'それ以上': 0.6 },
  // 曲がユーザー★と同じ場合の短縮係数(仕上げのみ)
  sameLevelFactor: 0.5,
  // 曲がユーザー★より下の場合: 一律この週数(確定 2026-07-11)
  belowLevelWeeks: 1,
  minWeeks: 1,
};

// 到達予測: userStar(確定★) × songStar(曲⭐︎) × dailyKey(Q6回答) → {weeks, label}
function estimatePeriod(userStar, songStar, dailyKey) {
  const P = PREDICTION_PARAMS;
  let weeks;
  if (songStar > userStar) {
    let climb = 0;
    for (let k = userStar + 1; k <= songStar; k++) climb += P.climbWeeks[k] || 0;
    weeks = (P.songBaseWeeks[songStar] + climb) * (P.timeFactor[dailyKey] ?? 1.0);
  } else if (songStar === userStar) {
    weeks = P.songBaseWeeks[songStar] * P.sameLevelFactor * (P.timeFactor[dailyKey] ?? 1.0);
  } else {
    weeks = P.belowLevelWeeks; // 格下曲は練習時間によらず一律1週間(確定 2026-07-11)
  }
  weeks = Math.max(P.minWeeks, weeks);
  return { weeks, label: formatPeriod(weeks) };
}
function formatPeriod(weeks) {
  if (weeks < 5) return `約${Math.max(1, Math.round(weeks))}週間`;
  const months = weeks / 4.345;
  if (months < 12) return `約${Math.round(months)}ヶ月`;
  if (months < 15) return '約1年';
  return '1年以上';
}

// 曲一覧の表示フィルタ【確定 2026-07-11】: ユーザー★と同ランク or 1つ上のみ表示
function visibleSongs(songs, userStar) {
  return songs.filter(([, star]) => star === userStar || star === userStar + 1);
}

if (typeof module !== 'undefined') module.exports = { judge, toProvisionalFlags, BANDS, estimatePeriod, PREDICTION_PARAMS, visibleSongs };
if (typeof window !== 'undefined') window.ArcodaLogic = { judge, toProvisionalFlags, BANDS, estimatePeriod, PREDICTION_PARAMS, visibleSongs };

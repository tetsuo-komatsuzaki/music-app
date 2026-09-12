// マスターの条件だけを持つ定数。music-analyzer/lib/achievement.py と揃える (画面表示用の写し)。
//
// なぜ独立したファイルなのか (2026-09-11):
//   skillMastery.ts は prisma を読み込むサーバ側のファイルなので、そこから「値」を取り込むと
//   クライアントコンポーネントのバンドルに pg まで引きずられて Module not found: dns で落ちる。
//   型は erase されるので `import type` なら通るが、定数は残る。だから定数だけをここに置く。
//   同種の踏み方: [[feedback_use_server_no_type_reexport]]

/** 直近この回数の平均で判定する。これに満たないうちは判定が始まらない */
export const MASTER_RECENT_COUNT = 5

/** 直近5回の平均がこの点以上でマスター */
export const MASTER_AVG = 90

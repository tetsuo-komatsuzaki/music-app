import { config } from "dotenv"
config()
async function main() {
  const { matchSongsForExpr } = await import("../app/_libs/exprSongMatch.server")
  for (const tag of ["expr_legato_singing", "expr_articulation", "expr_dynamics", "expr_tone_depth"]) {
    for (const star of [1, 2]) {
      const m = await matchSongsForExpr(tag, star)
      console.log(tag, `★${star}帯:`, m === null ? "null" : m.map((x) => `${x.title}(★${x.star},${x.score})`).join(" / ") || "(該当なし)")
    }
  }
}
main()

// 繰り返し原譜のパート変種16件を再ビルド (v115 の展開後切り出しで作り直す)
import { config } from "dotenv"
config()
import { randomUUID } from "crypto"
const RELAY_URL = process.env.RELAY_URL
const RELAY_KEY = process.env.RELAY_API_KEY
const IDS = ["cmte0rryt000404l1ujbz0bua","cmte0rsb1000504l17ga90xmb","cmte0rrl7000304l1f6lqve3n","cmtd6796k000104juo63l6b9g","cmtd679gp000204jufz5gwbgx","cmtd67487000004juuk93d6lk","cmtd6bo2c000204l7x339liyl","cmtd6bnp2000104l7sq6c6swp","cmtd6bn82000004l78ld13fiv","cmtd8q4qu000204l38zvbajrd","cmtd8q511000304l3d34g7tam","cmtd8q3ot000004l3nxr0z9zn","cmtd8q4ea000104l3eep4bejs","cmtd8x4no000004l1zywt5g7t","cmtd8x5c7000204l1novvxvl2","cmtd8x517000104l1f3w4lplt"]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function main() {
  for (const id of IDS) {
    const body = { mode: "score_full", idempotency_key: `partfix-${id}-${randomUUID().slice(0, 8)}`, is_practice: false, practice_item_id: id }
    const res = await fetch(`${RELAY_URL}/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RELAY_KEY}` },
      body: JSON.stringify(body),
    })
    console.log(id, res.ok ? "ok" : `HTTP ${res.status}`)
    await sleep(8000)
  }
}
main()

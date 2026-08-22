"use client"

// 出現演出 — モックの演出エンジンの移植 v4 (2026-08-20)。
// 原本: uiv2/app.v3.motion.css (葉っぱ層) + app.v5.motion.js (時間軸)。値は変えない。
//
// v5 の設計 (原本コメントより):
//   画面の中身を上から順に一本の時間軸に並べ直す。
//     ① カードの枠が出る (起き上がり: 22px + scale .985)
//     ② 中の項目が1つずつ出る (GAP_ITEM=95ms)
//     ③ その項目の★・チェック・バー・数字が灯る
//   ★やバーの待ち時間は「自分が乗っている項目が出た時刻 (--base)」起点。
//   項目より先に中身が光る事故を構造的に防ぐ。
//
// 葉っぱの待ち時間 (v5 の後勝ち規則そのまま):
//   ★ = base+240 + n*105 (1個ずつ・starPop) / 消えた★は starFade
//   チェック丸 = base+130、✓の線 = base+260 (描かれる)
//   番号丸 = base+150 / ピル = base+170 + n*70 / バー = base+200
//   リング = base+200 / 数字のカウント開始 = base+230 (終わりに一度弾む)
//
// アプリへの適応 (モックとの差はここだけ):
//   ・モックは1画面を丸ごと再生。アプリは最初の画面内のブロックに
//     累積オフセット (GAP_BLOCK=130 + 中身の長さ、上限3200で圧縮) を配り、
//     スクロールで後から見えたブロックは自分の時間軸 0 から再生 (IntersectionObserver)。
//   ・折れ線の自動判別 (drawLine/dotA) は本物イラスト (ArcoChan等) を壊すため
//     data-anim="chart" を付けたSVGだけに限定 (モックの .appfig 除外と同じ意図)。
//   ・prefers-reduced-motion では何もしない。楽譜 (OSMD) の中はいじらない。
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import ds from "./ds.module.css"

const GAP_ITEM = 95
const LEAD_IN = 170
const GAP_BLOCK = 130
const CAP = 3200

const CSS = `
html.rv-anim [data-rv] {
  opacity: 0;
  transform: translateY(22px) scale(.985);
  transform-origin: 50% 100%;
  transition: opacity .62s cubic-bezier(.2,.8,.25,1) var(--rvd, 0ms),
              transform .72s cubic-bezier(.18,.9,.22,1) var(--rvd, 0ms);
}
html.rv-anim [data-rv].rv-on { opacity: 1; transform: none; }
html.rv-anim [data-rv] [data-rvi] {
  opacity: 0;
  transform: translateY(9px);
  transition: opacity .46s cubic-bezier(.2,.8,.25,1) var(--rvd, 0ms),
              transform .52s cubic-bezier(.18,.9,.22,1) var(--rvd, 0ms);
}
html.rv-anim [data-rv].rv-on [data-rvi] { opacity: 1; transform: none; }
/* v5 noTx: 巻き戻し中は動きを止める。「戻る動きと出る動きが相殺する事故を構造的に防ぐ」(原本コメント) */
html.rv-anim .rv-notx, html.rv-anim .rv-notx * { transition: none !important; animation: none !important; }

/* ★ 1つずつ灯る */
html.rv-anim [data-rv] .rv-star { display: inline-block; opacity: 0; transform: scale(.3) rotate(-25deg); }
html.rv-anim [data-rv].rv-on .rv-star {
  animation: rvStarPop .52s cubic-bezier(.34,1.56,.64,1) forwards;
  animation-delay: calc(var(--base, 0ms) + 240ms + var(--si, 0) * 105ms);
}
html.rv-anim [data-rv].rv-on .rv-star.rv-off { animation-name: rvStarFade; }
@keyframes rvStarPop {
  0% { opacity: 0; transform: scale(.3) rotate(-25deg); }
  60% { opacity: 1; transform: scale(1.25) rotate(4deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}
@keyframes rvStarFade { to { opacity: 1; transform: scale(1); } }

/* チェック: 丸が開き ✓ が描かれる */
html.rv-anim [data-rv] .${ds.chk} { transform: scale(.5); opacity: 0; }
html.rv-anim [data-rv].rv-on .${ds.chk} {
  animation: rvChkIn .46s cubic-bezier(.34,1.56,.64,1) forwards;
  animation-delay: calc(var(--base, 0ms) + 130ms);
}
@keyframes rvChkIn { to { transform: scale(1); opacity: 1; } }
html.rv-anim [data-rv] .${ds.chk} svg path, html.rv-anim [data-rv] .${ds.chk} svg polyline { stroke-dasharray: 26; stroke-dashoffset: 26; }
html.rv-anim [data-rv].rv-on .${ds.chk} svg path, html.rv-anim [data-rv].rv-on .${ds.chk} svg polyline {
  animation: rvTick .5s cubic-bezier(.2,.9,.25,1) forwards;
  animation-delay: calc(var(--base, 0ms) + 260ms);
}
@keyframes rvTick { to { stroke-dashoffset: 0; } }

/* 未完了の番号: 静かに */
html.rv-anim [data-rv] .${ds.todo} { opacity: 0; }
html.rv-anim [data-rv].rv-on .${ds.todo} { animation: rvFadeIn .5s ease calc(var(--base, 0ms) + 150ms) forwards; }
@keyframes rvFadeIn { to { opacity: 1; } }

/* ピル: ふわり */
html.rv-anim [data-rv] .${ds.pill} { opacity: 0; transform: translateY(6px); }
html.rv-anim [data-rv].rv-on .${ds.pill} {
  animation: rvPillIn .5s cubic-bezier(.2,.9,.25,1) forwards;
  animation-delay: calc(var(--base, 0ms) + 170ms + var(--pd, 0) * 70ms);
}
@keyframes rvPillIn { to { opacity: 1; transform: none; } }

/* 数字: 上げ切ったあとに一度だけ弾む */
html.rv-anim .rv-settled { animation: rvSettle .42s cubic-bezier(.34,1.56,.64,1); }
@keyframes rvSettle { 0% { transform: scale(1); } 45% { transform: scale(1.08); } 100% { transform: scale(1); } }

/* 波形: 下から立ち上がってから律動へ */
html.rv-anim [data-rv] .${ds.wave} i { transform: scaleY(.06); transform-origin: center bottom; animation: none; }
html.rv-anim [data-rv].rv-on .${ds.wave} i {
  animation: rvBarRise .62s cubic-bezier(.2,.9,.25,1) calc(var(--base, 0ms) + 180ms + var(--i, 0) * 22ms) forwards,
             barPulse 2.6s ease-in-out calc(var(--base, 0ms) + 900ms + var(--i, 0) * -220ms) infinite;
}
@keyframes rvBarRise { to { transform: scaleY(1); } }

/* 折れ線 (data-anim="chart" のSVGのみ): 左から描かれ、節点が後から打たれる */
html.rv-anim [data-rv] .rv-line { stroke-dasharray: var(--len, 600); stroke-dashoffset: var(--len, 600); }
html.rv-anim [data-rv].rv-on .rv-line { animation: rvDrawIn 1.5s cubic-bezier(.25,.8,.3,1) calc(var(--base, 0ms) + 230ms) forwards; }
@keyframes rvDrawIn { to { stroke-dashoffset: 0; } }
html.rv-anim [data-rv] .rv-area { opacity: 0; }
html.rv-anim [data-rv].rv-on .rv-area { animation: rvFadeIn .9s ease calc(var(--base, 0ms) + 780ms) forwards; }
html.rv-anim [data-rv] .rv-dot { opacity: 0; transform-box: fill-box; transform-origin: center; }
html.rv-anim [data-rv].rv-on .rv-dot {
  animation: rvDotPop .42s cubic-bezier(.34,1.56,.64,1) forwards;
  animation-delay: calc(var(--base, 0ms) + 380ms + var(--di, 0) * 185ms);
}
@keyframes rvDotPop {
  0% { opacity: 0; transform: scale(0); }
  70% { opacity: 1; transform: scale(1.5); }
  100% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  html.rv-anim [data-rv], html.rv-anim [data-rv] [data-rvi],
  html.rv-anim [data-rv] .rv-star, html.rv-anim [data-rv] .${ds.chk},
  html.rv-anim [data-rv] .${ds.todo}, html.rv-anim [data-rv] .${ds.pill},
  html.rv-anim [data-rv] .rv-area, html.rv-anim [data-rv] .rv-dot {
    opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important;
  }
  html.rv-anim [data-rv] .rv-line { stroke-dashoffset: 0 !important; animation: none !important; }
  html.rv-anim [data-rv] .${ds.chk} svg path, html.rv-anim [data-rv] .${ds.chk} svg polyline { stroke-dashoffset: 0 !important; animation: none !important; }
  html.rv-anim [data-rv] .${ds.wave} i { transform: none !important; animation: none !important; }
}
`

// 数字を 0 から増やす (v5 countUp と同じ増え方 1150ms + 値*4、終わりに弾む)
function runCount(n: HTMLElement, baseMs: number) {
  if (n.children.length > 0 || n.dataset.rvFired) return
  n.dataset.rvFired = "1"
  const orig = n.dataset.rvOrig ?? (n.textContent ?? "").trim()
  const m = orig.match(/^(\D*)(\d+)(\D*)$/)
  if (!m) return
  const pre = m[1], target = +m[2], post = m[3]
  window.setTimeout(() => {
    const s0 = performance.now(), du = 1150 + Math.min(target, 100) * 4
    const step = (now: number) => {
      const pr = Math.min(1, (now - s0) / du)
      const q = 1 - Math.pow(1 - pr, 3)
      n.textContent = pre + Math.round(target * q) + post
      if (pr < 1) requestAnimationFrame(step)
      else {
        n.textContent = orig
        const host = n.closest(`.${ds.bigN}`) ?? n
        host.classList.add("rv-settled")
      }
    }
    requestAnimationFrame(step)
  }, baseMs + 230)
}

export default function RevealMotion() {
  const pathname = usePathname()

  useEffect(() => {
    // 診断バッジ (?rvdebug=1): 実機で「エンジンがどこまで動いたか」を画面に出す。
    // 原因特定用の一時装備。数値 = 準備/表示。
    const debug = location.search.includes("rvdebug")
    const badge = (() => {
      if (!debug) return null
      let el = document.getElementById("rv-badge") as HTMLElement | null
      if (!el) {
        el = document.createElement("div")
        el.id = "rv-badge"
        el.style.cssText = "position:fixed;left:8px;bottom:86px;z-index:99999;background:#000c;color:#7CFC9A;" +
          "font:11px/1.5 monospace;padding:6px 9px;border-radius:8px;max-width:82vw;white-space:pre-wrap"
        document.body.appendChild(el)
      }
      return el
    })()
    const say = (t: string) => { if (badge) badge.textContent = t }
    if (debug) {
      window.addEventListener("error", (e) => say("JSエラー: " + String(e.message).slice(0, 160)), { once: true })
    }
    say("演出: マウント済み")
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.remove("rv-boot")
      say("演出: 停止 (視差効果を減らす=ON)")
      return
    }
    const st0 = document.getElementById("rv-style")
    if (st0) st0.remove()
    const st = document.createElement("style")
    st.id = "rv-style"
    st.textContent = CSS
    document.head.appendChild(st)
    document.documentElement.classList.add("rv-anim")

    const main = () => (document.querySelector("main") ?? document.body) as HTMLElement
    const SEL = `h1, [data-anim="block"], [data-anim="rail"], .${ds.card}, .${ds.seg}, .${ds.letter}`
    const LEAF = `.${ds.chk}, .${ds.todo}, .${ds.pill}, [data-anim="ring"], [data-anim="bar"], [data-anim="count"], .${ds.wave}`

    // 見えたら発火 (モック v5 と同じ流儀)
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) reveal(e.target as HTMLElement) }),
      { threshold: 0.05, rootMargin: "0px 0px 40px 0px" },
    )

    const reveal = (el: HTMLElement) => {
      el.classList.add("rv-on")
      fireInner(el)
      io.unobserve(el)
    }

    // 出現の合図と同時に、値もの (リング/バー/数字) を目標へ動かす。待ち時間はCSSの --base 側
    const fireInner = (el: HTMLElement) => {
      el.querySelectorAll<HTMLElement>('[data-anim="ring"]').forEach((r) => {
        if (r.dataset.rvFired) return
        r.dataset.rvFired = "1"
        // 遅延マウント (発火済みブロックへ後から入ったリング) は下ごしらえ前なので、
        // いまの --p を目標として控えてから 0% に戻す。0%のまま固まる事故の防止
        if (!r.dataset.rvp) r.dataset.rvp = r.style.getPropertyValue("--p") || "0%"
        const target = r.dataset.rvp
        r.style.setProperty("--p", "0%")
        requestAnimationFrame(() => requestAnimationFrame(() => r.style.setProperty("--p", target)))
      })
      el.querySelectorAll<HTMLElement>('[data-anim="bar"]').forEach((b) => {
        if (b.dataset.rvFired) return
        b.dataset.rvFired = "1"
        b.classList.add("rv-go")
      })
      el.querySelectorAll<HTMLElement>('[data-anim="count"]').forEach((n) => {
        runCount(n, parseFloat(n.style.getPropertyValue("--base")) || 0)
      })
    }

    // ★ を1文字ずつ包む (v5 の下ごしらえ。<s> の中 = 消えた★は静かに)
    const splitStars = (el: HTMLElement) => {
      if (el.dataset.rvSplit === "1") return
      el.dataset.rvSplit = "1"
      let idx = 0
      const walk = (node: Node, off: boolean) => {
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment()
            for (const ch of n.textContent ?? "") {
              if (ch.trim() === "") { frag.appendChild(document.createTextNode(ch)); continue }
              const s = document.createElement("span")
              s.className = "rv-star" + (off ? " rv-off" : "")
              s.style.setProperty("--si", String(idx++))
              s.textContent = ch
              frag.appendChild(s)
            }
            node.replaceChild(frag, n)
          } else if (n.nodeType === 1) {
            walk(n, off || (n as HTMLElement).tagName.toLowerCase() === "s")
          }
        })
      }
      walk(el, false)
    }

    // 折れ線 (data-anim="chart" のSVGだけ): 線・面・節点を仕分ける
    const prepareChart = (svg: SVGSVGElement) => {
      svg.querySelectorAll<SVGPathElement>("path").forEach((p) => {
        const d = p.getAttribute("d") || ""
        const stroke = p.getAttribute("stroke") || ""
        const filled = p.getAttribute("fill")
        const isLine = !!stroke && (filled === "none" || filled === null) && (d.match(/[LC]/g) || []).length >= 2
        const isArea = !!filled && filled !== "none" && d.indexOf("Z") >= 0 && d.length > 40
        if (isLine && p.getTotalLength) {
          const len = Math.ceil(p.getTotalLength())
          if (len > 40) { p.classList.add("rv-line"); p.style.setProperty("--len", String(len)) }
        } else if (isArea) p.classList.add("rv-area")
      })
      if (svg.querySelector(".rv-line")) {
        svg.querySelectorAll<SVGCircleElement>("circle").forEach((c, i) => {
          const r = parseFloat(c.getAttribute("r") || "0")
          const s = getComputedStyle(c).stroke
          if (r > 0 && r <= 9 && s && s !== "none") {
            c.classList.add("rv-dot")
            c.style.setProperty("--di", String(i % 8))
          }
        })
      }
    }

    // 葉っぱに「乗っている項目の出現時刻」を配る
    const anchorLeaves = (block: HTMLElement, blockDelay: number) => {
      block.querySelectorAll<HTMLElement>(`.${ds.stars}`).forEach(splitStars)
      block.querySelectorAll<SVGSVGElement>('svg[data-anim="chart"]').forEach(prepareChart)
      const baseOf = (leaf: HTMLElement) => {
        const host = leaf.closest<HTMLElement>("[data-rvi]")
        return host && block.contains(host) ? parseFloat(host.dataset.rvt || "0") : blockDelay
      }
      block.querySelectorAll<HTMLElement>(LEAF).forEach((leaf) => {
        const base = baseOf(leaf)
        leaf.style.setProperty("--base", `${Math.round(base)}ms`)
        if (leaf.dataset.anim === "ring") {
          if (!leaf.dataset.rvp) leaf.dataset.rvp = leaf.style.getPropertyValue("--p") || "0%"
          leaf.style.setProperty("--p", "0%")
          leaf.style.setProperty("--rd", `${Math.round(base + 200)}ms`)
        }
        if (leaf.dataset.anim === "count" && leaf.children.length === 0) {
          // v5 reset と同じく、下ごしらえのたびに数字は 0 から (再生し直しでも巻き戻す)
          if (!leaf.dataset.rvOrig) {
            const txt = (leaf.textContent ?? "").trim()
            if (/^\D*\d+\D*$/.test(txt)) leaf.dataset.rvOrig = txt
          }
          const m = (leaf.dataset.rvOrig ?? "").match(/^(\D*)(\d+)(\D*)$/)
          if (m) leaf.textContent = m[1] + "0" + m[3]
        }
      })
      // ★は自分の項目の --base を継ぐ (包んだ直後なので個別に)
      block.querySelectorAll<HTMLElement>(".rv-star").forEach((s2) => {
        s2.style.setProperty("--base", `${Math.round(baseOf(s2))}ms`)
      })
      // 同じ項目の中でのピルの並び順 (v5 propagate と同じ「内側勝ち」)
      const boxes = [block, ...block.querySelectorAll<HTMLElement>("[data-rvi]")]
      boxes.forEach((box) => {
        box.querySelectorAll<HTMLElement>(`.${ds.pill}`).forEach((p, i) => p.style.setProperty("--pd", String(i)))
      })
      block.querySelectorAll<HTMLElement>(`.${ds.wave} i`).forEach((w, i) => {
        if (!w.style.getPropertyValue("--i")) w.style.setProperty("--i", String(i))
      })
    }

    // ブロックの下ごしらえ。offset = 最初の画面内での自分の開始時刻 (スクロール出現は 0)
    const prepare = (el: HTMLElement, offset = 0) => {
      if (el.dataset.rv !== undefined || el.closest("[id^='osmd']")) return
      if (el.parentElement?.closest("[data-rv]")) return
      el.dataset.rv = ""
      el.style.setProperty("--rvd", `${Math.round(offset)}ms`)
      // 項目 = カードの直下 (lab は枠と一緒に出る)。
      // 「すべてのカードが起き上がり、中の項目がその後に順番に起き上がる」(2026-08-20 明文化)。
      // 独自カード (data-anim="block") も ds.card と同格に扱う。
      // 実DOMで行のリストが入れ物のdivに包まれる場合は、その入れ物に
      // data-anim="items" を宣言すると中身が項目として順番に出る (要件v1.2)
      // data-anim="rail" = 横レール容器 (2026-08-22): レール全体を1ブロックとして
      // 発火し、中のカードを項目として順番に出す。カード1枚ずつを独立ブロックに
      // すると横画面外のカードが IO 未発火 (opacity 0) のまま残るため。
      // カード面の装飾 (F3/チルト) は付けない (ds.card / data-anim="block" のみが対象)。
      if (el.classList.contains(ds.card) || el.classList.contains(ds.letter) || el.dataset.anim === "block" || el.dataset.anim === "rail") {
        const pick = (host: HTMLElement) =>
          [...host.children].filter(
            (k) =>
              (k as HTMLElement).offsetHeight > 0 &&
              !k.classList.contains(ds.lab) &&
              !k.querySelector("[id^='osmd']"),
          ) as HTMLElement[]
        const directs = pick(el)
        const seq: HTMLElement[] = []
        for (const k of directs) {
          if (k.dataset.anim === "items") seq.push(...pick(k))
          else seq.push(k)
        }
        // 深い場所の items 容器 (行の列が入れ子のとき): 中身を時間軸の続きに乗せる
        el.querySelectorAll<HTMLElement>('[data-anim="items"]').forEach((c) => {
          if (!directs.includes(c)) seq.push(...pick(c))
        })
        seq.forEach((k, i) => {
          const t = offset + LEAD_IN + i * GAP_ITEM
          k.dataset.rvi = ""
          k.dataset.rvt = String(Math.round(t))
          k.style.setProperty("--rvd", `${Math.round(t)}ms`)
        })
      }
      anchorLeaves(el, offset)
      io.observe(el)
    }

    // 最初の画面: ブロックに累積の開始時刻を配る (v5 buildTimeline の塊間隔 + CAP圧縮)
    const prepareAll = () => {
      const blocks = [...main().querySelectorAll<HTMLElement>(SEL)]
      const vh = window.innerHeight
      // 一巡目: 画面内ブロックの所要を見積もって上限で圧縮率を決める
      let total = 0
      const spans = blocks.map((el) => {
        if (el.dataset.rv !== undefined) return 0
        if (el.getBoundingClientRect().top >= vh) return 0
        let n = 0
        if (el.classList.contains(ds.card) || el.classList.contains(ds.letter) || el.dataset.anim === "block" || el.dataset.anim === "rail") {
          n = [...el.children].filter((k) => (k as HTMLElement).offsetHeight > 0 && !k.classList.contains(ds.lab)).length
        }
        const span = GAP_BLOCK + (n > 0 ? LEAD_IN + n * GAP_ITEM + 40 : 0)
        total += span
        return span
      })
      const k = total > CAP ? CAP / total : 1
      let t = 0
      blocks.forEach((el, i) => {
        if (spans[i] > 0) {
          prepare(el, t * k)
          t += spans[i]
        } else {
          prepare(el, 0)
        }
      })
      // v3: ブロックの隠しが効いた次のフレームで rv-boot を解除 → main が現れると同時に
      // 各ブロックが時差出現する (最初の描画前から隠すのは layout.tsx のインラインスクリプト)
      requestAnimationFrame(() => document.documentElement.classList.remove("rv-boot"))
      if (debug) {
        const p2 = document.querySelectorAll("[data-rv]").length
        const on = document.querySelectorAll("[data-rv].rv-on").length
        say(`演出: 稼働  準備${p2} 表示${on}`)
        window.setInterval(() => {
          const a = document.querySelectorAll("[data-rv]").length
          const b2 = document.querySelectorAll("[data-rv].rv-on").length
          say(`演出: 稼働  準備${a} 表示${b2}`)
        }, 1000)
      }
    }
    // 描画済みの状態から隠すときは v5 と同じく必ず noTx の中で行う (規約6条)。
    // クライアント遷移では要素が見えたまま data-rv が付くため、素のままだと
    // 隠し(opacity 0)が transition (0.62s+遅延) 越しにゆっくり効き、隠れる前に
    // reveal が来て立ち上がりが見えなくなる (2026-08-22 Tetsuo指摘の真因)
    const t0 = window.setTimeout(() => {
      const m0 = main()
      m0.classList.add("rv-notx")
      prepareAll()
      void m0.offsetWidth
      requestAnimationFrame(() => m0.classList.remove("rv-notx"))
    }, 40)

    // 発火済みブロックへ後から入った中身 (fetch後の達成条件・基礎練・リング等) は
    // 「そのブロックを再生し直す」。手順は原本 v5 reset()/play() と1対1 (2026-08-21 是正):
    //   reset:  ① noTx を付ける (動きを止める)
    //           ② on を剥がし・印を剥がし・下ごしらえし直す (リング0%・数字0 も含む)
    //           ③ void offsetWidth (隠れた状態を確定させる)
    //   play:   ④ rAF → noTx を外す → void offsetWidth (動きを戻してから)
    //           ⑤ rAF → on を付ける + リング目標 + countUp (出現の合図)
    const replay = (host: HTMLElement) => {
      host.classList.add("rv-notx")                                   // ①
      host.classList.remove("rv-on")                                  // ②
      host.querySelectorAll<HTMLElement>("[data-rvi]").forEach((k) => {
        delete k.dataset.rvi
        delete k.dataset.rvt
        k.style.removeProperty("--rvd")
      })
      host.querySelectorAll<HTMLElement>("[data-anim]").forEach((el) => {
        delete el.dataset.rvFired
        el.classList.remove("rv-go")
      })
      host.querySelectorAll<HTMLElement>(".rv-settled").forEach((el) => el.classList.remove("rv-settled"))
      delete host.dataset.rv
      host.style.removeProperty("--rvd")
      prepare(host, 0)
      void host.offsetWidth                                           // ③
      requestAnimationFrame(() => {
        host.classList.remove("rv-notx")                              // ④
        void host.offsetWidth
        requestAnimationFrame(() => {
          if (host.isConnected) reveal(host)                          // ⑤
        })
      })
    }

    // 遅延描画 (fetch後のブロック / data-anim 部品) を拾う
    const mo = new MutationObserver((muts) => {
      const hosts = new Set<HTMLElement>()
      const fresh: HTMLElement[] = []
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.classList.contains("rv-star")) continue
          if (node.matches?.(SEL)) fresh.push(node)
          node.querySelectorAll?.<HTMLElement>(SEL).forEach((b) => fresh.push(b))
          // data-anim 部品を含む中身が入ったブロックだけ再生し直す
          // (アルコのポーズ替え等、演出部品を含まない差し替えでは再生しない)
          const host = node.closest?.("[data-rv].rv-on") as HTMLElement | null
          if (host && (node.matches?.("[data-anim]") || node.querySelector?.("[data-anim]"))) hosts.add(host)
        }
      }
      // 遅延描画のブロックも「noTx の中で隠す → 次のフレームで動きを戻す」(手順1対1)
      if (fresh.length) {
        const m0 = main()
        m0.classList.add("rv-notx")
        fresh.forEach((b) => prepare(b))
        void m0.offsetWidth
        requestAnimationFrame(() => m0.classList.remove("rv-notx"))
      }
      hosts.forEach(replay)
    })
    mo.observe(main(), { childList: true, subtree: true })

    // Safari の Back/Forward キャッシュ復元でも再生し直す。
    // 巻き戻しは原本どおり必ず noTx の中で行う (規約6条: 手順の1対1)
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      const m0 = main()
      m0.classList.add("rv-notx")                                     // ① 動きを止める
      document.querySelectorAll<HTMLElement>("[data-rv], [data-rvi]").forEach((el) => {
        el.classList.remove("rv-on")                                  // ② 巻き戻し
        delete el.dataset.rv
        delete el.dataset.rvi
        el.style.removeProperty("--rvd")
      })
      document.querySelectorAll<HTMLElement>("[data-anim]").forEach((el) => {
        delete el.dataset.rvFired
        el.classList.remove("rv-go")
      })
      document.querySelectorAll<HTMLElement>(".rv-settled").forEach((el) => el.classList.remove("rv-settled"))
      window.setTimeout(() => {
        prepareAll()
        void m0.offsetWidth                                           // ③ 隠れた状態を確定
        requestAnimationFrame(() => m0.classList.remove("rv-notx"))   // ④ 動きを戻す → IOが⑤発火
      }, 40)
    }
    window.addEventListener("pageshow", onShow)

    return () => {
      document.documentElement.classList.remove("rv-boot")
      window.clearTimeout(t0)
      window.removeEventListener("pageshow", onShow)
      io.disconnect()
      mo.disconnect()
      // 遷移時は隠れたまま残さない
      document.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => el.classList.add("rv-on"))
    }
  }, [pathname])

  return null
}

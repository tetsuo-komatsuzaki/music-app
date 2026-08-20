"use client"

// 出現演出 — モックの演出エンジン app.v5.motion.js の移植 v2 (2026-08-20)。
// 三層の原則 (演出要件v1.1)。値はモックと同じ GAP_ITEM=95 / LEAD_IN=170。
//
// v1 は「読み込み直後に一括再生・一度きり」で、実機で動かない穴が2つあった:
//   ・Safari の Back/Forward キャッシュ復元では effect が走らず静止のまま
//   ・画面外のブロックは再生済み扱いになり、スクロールしても動かない
// v2 はモック同様「ブロックが見えたときに発火」(IntersectionObserver)。
// 遅延描画 (fetch後のブロック) は MutationObserver で拾って同じ流儀で発火。
// prefers-reduced-motion では何もしない。楽譜 (OSMD) の中はいじらない。
//
// 対象の決め方 (演出要件v1.1 data-anim方式):
//   1. data-anim="block" を明示した要素
//   2. デザインシステムの card / seg (= モックのエンジンが対象にしていたクラスの実体)
//   3. h1 (見出し)
// クラス名の部分一致による推測はしない。
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import ds from "./ds.module.css"

const GAP_ITEM = 95
const LEAD_IN = 170

const CSS = `
html.rv-anim [data-rv] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .7s ease var(--rvd, 0s), transform .7s cubic-bezier(.2,.8,.25,1) var(--rvd, 0s);
}
html.rv-anim [data-rv].rv-on { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  html.rv-anim [data-rv] { opacity: 1 !important; transform: none !important; transition: none !important; }
}
`

function fireInner(el: HTMLElement) {
  // リング: --p を 0% から目標へ (globals の transition が効く)
  el.querySelectorAll<HTMLElement>('[data-anim="ring"]').forEach((r) => {
    if (r.dataset.rvFired) return
    r.dataset.rvFired = "1"
    const target = r.style.getPropertyValue("--p") || "0%"
    r.style.setProperty("--p", "0%")
    window.setTimeout(() => r.style.setProperty("--p", target), 120)
  })
  // バー: 0 → --w
  el.querySelectorAll<HTMLElement>('[data-anim="bar"]').forEach((b) => {
    if (b.dataset.rvFired) return
    b.dataset.rvFired = "1"
    window.setTimeout(() => b.classList.add("rv-go"), 100)
  })
  // 数字のカウントアップ (子タグ入りは対象外 = Lv.7 の守り)
  el.querySelectorAll<HTMLElement>('[data-anim="count"]').forEach((n) => {
    if (n.children.length > 0 || n.dataset.rvFired) return
    n.dataset.rvFired = "1"
    const txt = (n.textContent ?? "").trim()
    const m = txt.match(/^(\D*)(\d+)(\D*)$/)
    if (!m) return
    const target = +m[2], pre = m[1], post = m[3]
    const s0 = performance.now(), du = 1150 + Math.min(target, 100) * 4
    const step = (now: number) => {
      const pr = Math.min(1, (now - s0) / du)
      const q = 1 - Math.pow(1 - pr, 3)
      n.textContent = pre + Math.round(target * q) + post
      if (pr < 1) requestAnimationFrame(step)
      else n.textContent = txt
    }
    requestAnimationFrame(step)
  })
}

export default function RevealMotion() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!document.getElementById("rv-style")) {
      const st = document.createElement("style")
      st.id = "rv-style"
      st.textContent = CSS
      document.head.appendChild(st)
    }
    document.documentElement.classList.add("rv-anim")

    const main = () => (document.querySelector("main") ?? document.body) as HTMLElement
    const SEL = `h1, [data-anim="block"], .${ds.card}, .${ds.seg}`

    // 見えたら発火 (モック v5 と同じ流儀)
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) reveal(e.target as HTMLElement) }),
      { threshold: 0.05, rootMargin: "0px 0px 40px 0px" },
    )

    const reveal = (el: HTMLElement) => {
      el.classList.add("rv-on")
      el.querySelectorAll<HTMLElement>(":scope > [data-rv]").forEach((k) => k.classList.add("rv-on"))
      fireInner(el)
      io.unobserve(el)
    }

    // ブロックの下ごしらえ: 隠して、直下の項目に時差を配る
    const prepare = (el: HTMLElement) => {
      if (el.dataset.rv !== undefined || el.closest("[id^='osmd']")) return
      if (el.parentElement?.closest("[data-rv]")) return
      el.dataset.rv = ""
      el.style.setProperty("--rvd", "0ms")
      const kids = [...el.children].filter(
        (k) =>
          (k as HTMLElement).offsetHeight > 0 &&
          !k.classList.contains(ds.lab) &&
          !k.querySelector("[id^='osmd']"),
      ) as HTMLElement[]
      if (kids.length > 1) {
        kids.forEach((k, i) => {
          k.dataset.rv = ""
          k.style.setProperty("--rvd", `${LEAD_IN + i * GAP_ITEM}ms`)
        })
      }
      io.observe(el)
    }

    const prepareAll = () => main().querySelectorAll<HTMLElement>(SEL).forEach(prepare)
    const t0 = window.setTimeout(prepareAll, 40)

    // 遅延描画 (fetch後のブロック / data-anim 部品) を拾う
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches?.(SEL)) prepare(node)
          node.querySelectorAll?.<HTMLElement>(SEL).forEach(prepare)
          // すでに見えているブロックの中へ後から入った部品は直接発火
          const host = node.closest?.("[data-rv].rv-on")
          if (host) fireInner(host as HTMLElement)
        }
      }
    })
    mo.observe(main(), { childList: true, subtree: true })

    // Safari の Back/Forward キャッシュ復元でも再生し直す (v1で動かなかった真因のひとつ)
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      document.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => {
        el.classList.remove("rv-on")
        delete el.dataset.rv
        el.style.removeProperty("--rvd")
      })
      document.querySelectorAll<HTMLElement>("[data-anim]").forEach((el) => {
        delete el.dataset.rvFired
        el.classList.remove("rv-go")
      })
      window.setTimeout(prepareAll, 40)
    }
    window.addEventListener("pageshow", onShow)

    return () => {
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

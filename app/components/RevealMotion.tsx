"use client"

// 出現演出 — モックの演出エンジン app.v5.motion.js の移植 (2026-08-20)。
// 三層の原則 (演出要件v1.1): 塊(カード/見出し) → 項目(カード直下の行) の順に
// 上から時差で現れる。値はモックと同じ GAP_BLOCK=130 / GAP_ITEM=95 / LEAD_IN=170 / CAP=3200。
// ページ遷移のたびに再生。prefers-reduced-motion では何もしない。
// 楽譜 (OSMD) の中はいじらない。
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import ds from "./ds.module.css"

const GAP_BLOCK = 130
const GAP_ITEM = 95
const LEAD_IN = 170
const CAP = 3200

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

// 対象の決め方 (演出要件v1.1 data-anim方式):
//   1. data-anim="block" を明示した要素
//   2. デザインシステムの card / seg (= モックのエンジンが対象にしていたクラスの実体)
//   3. h1 (見出し)
// クラス名の部分一致による推測はしない。

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

    let raf = 0
    const timers: number[] = []
    // 描画が落ち着いてから走らせる (サーバー描画の中身が揃うのを待つ)
    const start = window.setTimeout(() => {
      const main = document.querySelector("main") ?? document.body
      // 塊: 本文直系のカード・見出し。楽譜の中は対象外
      const sel = `h1, [data-anim="block"], .${ds.card}, .${ds.seg}`
      const blocks = [...main.querySelectorAll(sel)].filter(
        (el) =>
          !el.closest("[id^='osmd']") &&
          !el.parentElement?.closest("[data-rv]") &&
          (el as HTMLElement).offsetHeight > 0,
      )
      if (blocks.length === 0) return

      let t = 0
      const marked: HTMLElement[] = []
      for (const b of blocks) {
        const el = b as HTMLElement
        el.dataset.rv = ""
        el.style.setProperty("--rvd", `${Math.round(t)}ms`)
        marked.push(el)
        t += GAP_BLOCK
        // 項目: 塊の直下の行 (モックの GAP_ITEM)
        const kids = [...el.children].filter(
          (k) =>
            (k as HTMLElement).offsetHeight > 0 &&
            !k.classList.contains(ds.lab) &&
            !k.querySelector("[id^='osmd']"),
        ) as HTMLElement[]
        if (kids.length > 1) {
          let ti = t + LEAD_IN
          for (const k of kids) {
            k.dataset.rv = ""
            k.style.setProperty("--rvd", `${Math.round(ti)}ms`)
            marked.push(k)
            ti += GAP_ITEM
          }
          t = ti - GAP_ITEM + 40
        }
      }
      // 項目が多い画面は全体を縮めて同じ体感に (モックの CAP)
      if (t > CAP) {
        const k = CAP / t
        for (const el of marked) {
          const v = parseFloat(el.style.getPropertyValue("--rvd"))
          if (!Number.isNaN(v)) el.style.setProperty("--rvd", `${Math.round(v * k)}ms`)
        }
      }
      document.documentElement.classList.add("rv-anim")
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          for (const el of marked) el.classList.add("rv-on")
          // リング: --p を 0% から目標へ (globals の transition が効く)
          main.querySelectorAll<HTMLElement>('[data-anim="ring"]').forEach((r) => {
            const target = r.style.getPropertyValue("--p") || "0%"
            r.style.setProperty("--p", "0%")
            window.setTimeout(() => r.style.setProperty("--p", target), 80)
          })
          // バー: 0 → --w
          main.querySelectorAll<HTMLElement>('[data-anim="bar"]').forEach((el2) => {
            window.setTimeout(() => el2.classList.add("rv-go"), 60)
          })
          // 数字のカウントアップ (子タグ入りは対象外 = Lv.7 の守り)
          main.querySelectorAll<HTMLElement>('[data-anim="count"]').forEach((n) => {
            if (n.children.length > 0) return
            const txt = (n.textContent ?? "").trim()
            const m2 = txt.match(/^(\D*)(\d+)(\D*)$/)
            if (!m2) return
            const t2 = +m2[2], pre = m2[1], post = m2[3]
            const s0 = performance.now(), du = 1150 + Math.min(t2, 100) * 4
            const step = (now: number) => {
              const pr = Math.min(1, (now - s0) / du)
              const q = 1 - Math.pow(1 - pr, 3)
              n.textContent = pre + Math.round(t2 * q) + post
              if (pr < 1) requestAnimationFrame(step)
              else n.textContent = txt
            }
            requestAnimationFrame(step)
          })
        })
      })
      // 終わったら痕跡を消す (再遷移時に作り直す)
      timers.push(window.setTimeout(() => {
        for (const el of marked) {
          el.classList.remove("rv-on")
          delete el.dataset.rv
          el.style.removeProperty("--rvd")
        }
        document.documentElement.classList.remove("rv-anim")
      }, Math.min(t, CAP) + 1200))
    }, 60)

    // あとから読み込まれるブロック (fetch後描画のゴール/基礎練など) は
    // 初回走査に乗らないため、現れた時点で個別に発火させる (再検査 2026-08-20 で発見した穴)
    const late = new MutationObserver((muts) => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          const targets = [
            ...(node.matches?.('[data-anim]') ? [node] : []),
            ...node.querySelectorAll?.('[data-anim]') ?? [],
          ] as HTMLElement[]
          for (const el of targets) {
            const kind = el.dataset.anim
            if (kind === "bar" && !el.classList.contains("rv-go")) {
              window.setTimeout(() => el.classList.add("rv-go"), 60)
            } else if (kind === "ring") {
              const target = el.style.getPropertyValue("--p") || "0%"
              el.style.setProperty("--p", "0%")
              window.setTimeout(() => el.style.setProperty("--p", target), 80)
            } else if (kind === "count" && el.children.length === 0 && !el.dataset.rvCounted) {
              el.dataset.rvCounted = "1"
              const txt = (el.textContent ?? "").trim()
              const m2 = txt.match(/^(\D*)(\d+)(\D*)$/)
              if (!m2) continue
              const t2 = +m2[2], pre = m2[1], post = m2[3]
              const s0 = performance.now(), du = 1150 + Math.min(t2, 100) * 4
              const step = (now: number) => {
                const pr = Math.min(1, (now - s0) / du)
                const q = 1 - Math.pow(1 - pr, 3)
                el.textContent = pre + Math.round(t2 * q) + post
                if (pr < 1) requestAnimationFrame(step)
                else el.textContent = txt
              }
              requestAnimationFrame(step)
            }
          }
        }
      }
    })
    late.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true })

    return () => {
      late.disconnect()
      window.clearTimeout(start)
      timers.forEach((x) => window.clearTimeout(x))
      if (raf) cancelAnimationFrame(raf)
      document.documentElement.classList.remove("rv-anim")
      document.querySelectorAll("[data-rv]").forEach((el) => {
        el.classList.remove("rv-on")
        ;(el as HTMLElement).style.removeProperty("--rvd")
        delete (el as HTMLElement).dataset.rv
      })
    }
  }, [pathname])

  return null
}

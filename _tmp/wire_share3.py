# フェーズ3: 証明書/認定証/メダルのシェア3種 (2026-08-31 Tetsuo承認)
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

# ── shareCard.ts ──
sub("app/_libs/shareCard.ts",
    'export type ShareKind = "master" | "rank_up" | "weekly" | "daily"',
    'export type ShareKind = "master" | "rank_up" | "weekly" | "daily" | "cert" | "nintei" | "medal"',
    "kind union")

sub("app/_libs/shareCard.ts",
    """  recs?: number // 録音した回数
  skills?: number // 伸びたわざ (正式習得=レッスンクリアのみ)
}""",
    """  recs?: number // 録音した回数
  skills?: number // 伸びたわざ (正式習得=レッスンクリアのみ)
  // cert (マスター証明書)
  certNo?: number // 獲得順の通し番号
  // nintei (アルコの認定証)
  big?: string // 大見出し (例 100 DAYS)
  kindLine?: string // 種別行 (例 継続の認定証)
  // medal
  count?: number // カード枚数の節目
}""",
    "payload fields")

sub("app/_libs/shareCard.ts",
    'export const SHARE_KINDS: readonly ShareKind[] = ["master", "rank_up", "weekly", "daily"]',
    'export const SHARE_KINDS: readonly ShareKind[] = ["master", "rank_up", "weekly", "daily", "cert", "nintei", "medal"]',
    "kinds array")

sub("app/_libs/shareCard.ts",
    """export function isCelebrationKind(kind: ShareKind): boolean {
  return kind === "master" || kind === "rank_up"
}""",
    """export function isCelebrationKind(kind: ShareKind): boolean {
  return kind === "master" || kind === "rank_up" || kind === "cert" || kind === "nintei" || kind === "medal"
}""",
    "celebration kinds")

sub("app/_libs/shareCard.ts",
    """  weekly: { eyebrow: "📅 WEEKLY REPORT", label: "今週のがんばり" },
  daily: { eyebrow: "🎵 TODAY'S PLAY", label: "きょうの演奏" },
}""",
    """  weekly: { eyebrow: "📅 WEEKLY REPORT", label: "今週のがんばり" },
  daily: { eyebrow: "🎵 TODAY'S PLAY", label: "きょうの演奏" },
  cert: { eyebrow: "📜 MASTER CERTIFICATE", label: "マスター証明書" },
  nintei: { eyebrow: "📜 CERTIFICATE", label: "アルコの認定証" },
  medal: { eyebrow: "🏅 MEDAL", label: "カードのメダル" },
}""",
    "kind meta")

sub("app/_libs/shareCard.ts",
    """    case "daily":
      return `「${p.title ?? ""}」を演奏しました 音程${p.pitch ?? "-"}点・リズム${p.timing ?? "-"}点🎵🎻 #アルコ #バイオリン`
  }
}""",
    """    case "daily":
      return `「${p.title ?? ""}」を演奏しました 音程${p.pitch ?? "-"}点・リズム${p.timing ?? "-"}点🎵🎻 #アルコ #バイオリン`
    case "cert":
      return `「${p.title ?? ""}」のマスター証明書をもらいました！📜🎻 #アルコ #バイオリン`
    case "nintei":
      return `${p.kindLine ?? "認定証"}をもらいました！📜🎻 #アルコ #バイオリン`
    case "medal":
      return `カード${p.count ?? ""}枚のメダルをもらいました！🏅🎻 #アルコ #バイオリン`
  }
}""",
    "share text")

sub("app/_libs/shareCard.ts",
    """    case "weekly": return `${who}今週も練習がんばりました | アルコ`
    case "daily": return `${who}「${p.title ?? ""}」を演奏しました | アルコ`
  }
}""",
    """    case "weekly": return `${who}今週も練習がんばりました | アルコ`
    case "daily": return `${who}「${p.title ?? ""}」を演奏しました | アルコ`
    case "cert": return `${who}「${p.title ?? ""}」のマスター証明書を獲得！ | アルコ`
    case "nintei": return `${who}${p.kindLine ?? "認定証"}を獲得！ | アルコ`
    case "medal": return `${who}カード${p.count ?? ""}枚のメダルを獲得！ | アルコ`
  }
}""",
    "og title")

# ── SharePublicView ──
sub("app/s/[token]/SharePublicView.tsx",
    """const POSE_ID: Record<ShareKind, string> = {
  master: "02A", rank_up: "02B", weekly: "02C", daily: "01A",
}""",
    """const POSE_ID: Record<ShareKind, string> = {
  master: "02A", rank_up: "02B", weekly: "02C", daily: "01A",
  cert: "02A", nintei: "02C", medal: "02B",
}""",
    "view poses")

sub("app/s/[token]/SharePublicView.tsx",
    '''  const eyebrow =
    kind === "weekly" ? `${meta.eyebrow} ・ ${p.period ?? ""}` :
    kind === "daily" ? `${meta.eyebrow} ・ ${p.date ?? ""}` : meta.eyebrow
  const headline =
    kind === "master" || kind === "daily" ? (p.title ?? "") :
    kind === "weekly" ? "今週も頑張ったね！" : "つぎのステージへ！"
  const headlineCqw =
    kind === "master" || kind === "daily" ? `${(titleFontPx(headline, 594) / 100).toFixed(2)}cqw` : "4.69cqw"''',
    '''  const eyebrow =
    kind === "weekly" ? `${meta.eyebrow} ・ ${p.period ?? ""}` :
    kind === "daily" ? `${meta.eyebrow} ・ ${p.date ?? ""}` :
    kind === "nintei" ? `${meta.eyebrow} ・ ${p.kindLine ?? ""}` : meta.eyebrow
  const headline =
    kind === "master" || kind === "daily" || kind === "cert" ? (p.title ?? "") :
    kind === "nintei" ? (p.big ?? "") :
    kind === "medal" ? `カード${p.count ?? 0}枚の節目` :
    kind === "weekly" ? "今週も頑張ったね！" : "つぎのステージへ！"
  const headlineCqw =
    kind === "master" || kind === "daily" || kind === "cert" ? `${(titleFontPx(headline, 594) / 100).toFixed(2)}cqw` : "4.69cqw"''',
    "view headline")

sub("app/s/[token]/SharePublicView.tsx",
    """                {kind === "daily" && <>
                  <Stat value={String(p.pitch ?? 0)} unit="点" label="音程" color="#a97b1f" />
                  <Stat value={String(p.timing ?? 0)} unit="点" label="リズム" color="#0f8a4f" />
                  {p.bestDelta != null
                    ? <Stat value={`+${p.bestDelta}`} label="自己ベスト更新" color="#4f63c8" />
                    : <Stat value={String(p.attempts ?? 1)} unit="回目" label="挑戦" color="#4f63c8" />}
                </>}""",
    """                {kind === "daily" && <>
                  <Stat value={String(p.pitch ?? 0)} unit="点" label="音程" color="#a97b1f" />
                  <Stat value={String(p.timing ?? 0)} unit="点" label="リズム" color="#0f8a4f" />
                  {p.bestDelta != null
                    ? <Stat value={`+${p.bestDelta}`} label="自己ベスト更新" color="#4f63c8" />
                    : <Stat value={String(p.attempts ?? 1)} unit="回目" label="挑戦" color="#4f63c8" />}
                </>}
                {kind === "cert" && <>
                  <Stat value={`★${p.star ?? 1}`} label="レベル" color="#a97b1f" />
                  {p.certNo != null && <Stat value={`No.${String(p.certNo).padStart(3, "0")}`} label="認定番号" color="#4f63c8" />}
                  <Stat value={p.date ?? ""} label="認定日" color="#0f8a4f" />
                </>}
                {kind === "nintei" && <>
                  <Stat value={p.date ?? ""} label="認定日" color="#0f8a4f" />
                </>}
                {kind === "medal" && <>
                  <Stat value={String(p.count ?? 0)} unit="枚" label="あつめたカード" color="#a97b1f" />
                  <Stat value={p.date ?? ""} label="獲得日" color="#0f8a4f" />
                </>}""",
    "view stats")

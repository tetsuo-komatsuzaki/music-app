# フェーズ3 その2: action分岐 + OG + ギャラリーのシェア導線
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

# ── shareCards.ts: 3種の payload 生成 ──
sub("app/actions/shareCards.ts",
    """    if (!payload) return { ok: false, error: "作成できませんでした" }""",
    """    if (input.kind === "cert") {
      // マスター証明書: マスター済みの曲のみ。番号=マスター順の通し
      if (!input.refId || !isValidCuid(input.refId)) return { ok: false, error: "対象が不正です" }
      const ach = await prisma.userScoreAchievement.findUnique({
        where: { userId_scoreId: { userId: dbUser.id, scoreId: input.refId } },
        select: { masteredAt: true, starAtAchievement: true, score: { select: { title: true } } },
      })
      if (!ach?.masteredAt) return { ok: false, error: "この曲はまだマスターしていません" }
      const masters = await prisma.userScoreAchievement.findMany({
        where: { userId: dbUser.id, masteredAt: { not: null } },
        orderBy: { masteredAt: "asc" }, select: { scoreId: true },
      })
      const certNo = masters.findIndex((m) => m.scoreId === input.refId) + 1
      payload = {
        title: ach.score.title, star: ach.starAtAchievement,
        certNo: certNo > 0 ? certNo : undefined, date: fmtMDJst(ach.masteredAt),
      }
    }

    if (input.kind === "nintei") {
      // アルコの認定証: 最難関クエストのクリアが条件。券面文言はカタログの正
      const face = input.refId ? NINTEI_FACES[input.refId] : undefined
      if (!face) return { ok: false, error: "対象が不正です" }
      const clear = await prisma.userQuestClear.findUnique({
        where: { userId_questId: { userId: dbUser.id, questId: input.refId! } },
        select: { clearedAt: true },
      })
      if (!clear) return { ok: false, error: "この認定証はまだもらっていません" }
      payload = { big: face.big, kindLine: face.kindLine, date: fmtMDJst(clear.clearedAt) }
    }

    if (input.kind === "medal") {
      // メダル: 獲得済み (UserTreasure) のみ
      const n = Number(input.refId)
      if (!Number.isInteger(n) || n <= 0) return { ok: false, error: "対象が不正です" }
      const medal = await prisma.userTreasure.findFirst({
        where: { userId: dbUser.id, kind: "medal", sourceId: String(n) },
        select: { earnedAt: true },
      })
      if (!medal) return { ok: false, error: "このメダルはまだもらっていません" }
      payload = { count: n, date: fmtMDJst(medal.earnedAt) }
    }

    if (!payload) return { ok: false, error: "作成できませんでした" }""",
    "action branches")

sub("app/actions/shareCards.ts",
    """    // 報酬体系: シェアクエスト (No.076) + シェア累計 (No.127/146)
    try {
      const { questEventHook, actionCountHook } = await import("@/app/_libs/treasureEngine")
      await questEventHook(dbUser.id, "share_card")
      await actionCountHook(dbUser.id, "share")
    } catch { /* noop */ }""",
    """    // 報酬体系: シェアクエスト (No.076) + 種別クエスト (083/097/098) + シェア累計 (127/146)
    try {
      const { questEventHook, actionCountHook } = await import("@/app/_libs/treasureEngine")
      await questEventHook(dbUser.id, "share_card")
      if (input.kind === "cert") await questEventHook(dbUser.id, "share_cert")
      if (input.kind === "nintei") await questEventHook(dbUser.id, "share_nintei")
      if (input.kind === "medal") await questEventHook(dbUser.id, "share_medal")
      await actionCountHook(dbUser.id, "share")
    } catch { /* noop */ }""",
    "action quest hooks")

# import に NINTEI_FACES を追加
s = io.open("app/actions/shareCards.ts", encoding="utf-8").read()
if "NINTEI_FACES" not in s.split("createShareCard")[0]:
    old = 'import {'
    assert old in s
    s = s.replace(old, 'import { NINTEI_FACES } from "@/app/_libs/treasureCatalog"\nimport {', 1)
    io.open("app/actions/shareCards.ts", "w", encoding="utf-8").write(s)
    print("ok action import")

# ── shareOg.tsx: ポーズと headline/stats 分岐 ──
sub("app/_libs/shareOg.tsx",
    'const ARCO_KIND_KIT: Record<ShareKind, string> = { master: "02A", rank_up: "02B", weekly: "10A", daily: "06A" }',
    'const ARCO_KIND_KIT: Record<ShareKind, string> = { master: "02A", rank_up: "02B", weekly: "10A", daily: "06A", cert: "02A", nintei: "02C", medal: "02B" }',
    "og poses")

sub("app/_libs/shareOg.tsx",
    """  const eyebrowText =
    kind === "weekly" ? `${plainEyebrow} ・ ${p.period ?? ""}` :
    kind === "daily" ? `${plainEyebrow} ・ ${p.date ?? ""}` : plainEyebrow

  const headline =
    kind === "master" || kind === "daily" ? (p.title ?? "") :
    kind === "weekly" ? "今週も頑張ったね！" : "つぎのステージへ！"
  const headlineFs =
    kind === "master" || kind === "daily" ? titleFontPx(headline, px(38)) : px(30)""",
    """  const eyebrowText =
    kind === "weekly" ? `${plainEyebrow} ・ ${p.period ?? ""}` :
    kind === "daily" ? `${plainEyebrow} ・ ${p.date ?? ""}` :
    kind === "nintei" ? `${plainEyebrow} ・ ${p.kindLine ?? ""}` : plainEyebrow

  const headline =
    kind === "master" || kind === "daily" || kind === "cert" ? (p.title ?? "") :
    kind === "nintei" ? (p.big ?? "") :
    kind === "medal" ? `カード${p.count ?? 0}枚の節目` :
    kind === "weekly" ? "今週も頑張ったね！" : "つぎのステージへ！"
  const headlineFs =
    kind === "master" || kind === "daily" || kind === "cert" ? titleFontPx(headline, px(38)) : px(30)""",
    "og headline")

sub("app/_libs/shareOg.tsx",
    """    } else {
      stats.push(<Stat key="n" value={String(p.attempts ?? 1)} unit="回目" label="挑戦" color={C.blue} fs={px(24)} />)
    }
  }""",
    """    } else {
      stats.push(<Stat key="n" value={String(p.attempts ?? 1)} unit="回目" label="挑戦" color={C.blue} fs={px(24)} />)
    }
  } else if (kind === "cert") {
    stats.push(<Stat key="s" value={`★${p.star ?? 1}`} label="レベル" color={C.gold} fs={px(24)} />)
    if (p.certNo != null) stats.push(<Stat key="n" value={`No.${String(p.certNo).padStart(3, "0")}`} label="認定番号" color={C.blue} fs={px(24)} />)
    stats.push(<Stat key="d" value={p.date ?? ""} label="認定日" color={C.green} fs={px(24)} />)
  } else if (kind === "nintei") {
    stats.push(<Stat key="d" value={p.date ?? ""} label="認定日" color={C.green} fs={px(24)} />)
  } else if (kind === "medal") {
    stats.push(<Stat key="c" value={String(p.count ?? 0)} unit="枚" label="あつめたカード" color={C.gold} fs={px(24)} />)
    stats.push(<Stat key="d" value={p.date ?? ""} label="獲得日" color={C.green} fs={px(24)} />)
  }""",
    "og stats")

# イベント型クエストの配線 8箇所+シェア累計 (2026-08-31 Tetsuo承認)
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

# 006 パート別に録音採点する (uploadRecord・partId付き区間録音)
sub("app/actions/uploadRecord.ts",
    """    await prisma.performance.update({
      where: { id: performance.id },
      data: { rangeFromNote: rf, rangeToNote: rt, partId },
    })
  }""",
    """    await prisma.performance.update({
      where: { id: performance.id },
      data: { rangeFromNote: rf, rangeToNote: rt, partId },
    })
    // 報酬体系: パート別録音クエスト (No.006・冪等)
    if (partId) {
      const { questEventHook } = await import("@/app/_libs/treasureEngine")
      await questEventHook(dbUser.id, "part_variant")
    }
  }""",
    "006 part_variant")

# 007 演奏を聴き返す (scoreDetail togglePlay)
sub("app/[userId]/scores/[scoreId]/scoreDetail.tsx",
    """    a.src = p.audioUrl
    a.play().then(() => setPlayingId(p.id)).catch(() => setPlayingId(null))
  }""",
    """    a.src = p.audioUrl
    a.play().then(() => {
      setPlayingId(p.id)
      // 報酬体系: 聴き返しクエスト (No.007・白リスト検証つきの1行)
      void import("@/app/actions/questEvents").then((m) => m.recordQuestEvent("listen_back"))
    }).catch(() => setPlayingId(null))
  }""",
    "007 listen_back")

# 012 テンポをかえて弾く (再生開始時にテンポが原曲から変更されていたら)
sub("app/[userId]/scores/[scoreId]/scoreDetail.tsx",
    """    setPlaybackState("playing")""",
    """    setPlaybackState("playing")
    // 報酬体系: テンポ変更クエスト (No.012・原曲テンポ以外で弾いたら)
    if (analysis?.bpm != null && playbackTempo !== analysis.bpm) {
      void import("@/app/actions/questEvents").then((m) => m.recordQuestEvent("tempo_change"))
    }""",
    "012 tempo_change")

# 017 技術マップを見る (progress/skills サーバーページ)
sub("app/[userId]/progress/skills/page.tsx",
    """  const data = await buildKarteData(dbUser.id, userId, period)""",
    """  // 報酬体系: 技術マップ閲覧クエスト (No.017・失敗しても表示は止めない)
  try {
    const { questEventHook } = await import("@/app/_libs/treasureEngine")
    await questEventHook(dbUser.id, "skill_map")
  } catch { /* noop */ }

  const data = await buildKarteData(dbUser.id, userId, period)""",
    "017 skill_map")

# 019 お気に入りに登録 (favorites API・追加時のみ)
sub("app/api/favorites/route.ts",
    """    } else if (scoreId) {
      await prisma.favorite.deleteMany({ where: { userId, scoreId } })""",
    """      // 報酬体系: お気に入りクエスト (No.019・追加時のみ)
      try {
        const { questEventHook } = await import("@/app/_libs/treasureEngine")
        await questEventHook(userId, "favorite")
      } catch { /* noop */ }
    } else if (scoreId) {
      await prisma.favorite.deleteMany({ where: { userId, scoreId } })""",
    "019 favorite")

# 076 カードをシェアする + 127/146 シェア累計 (createShareCard 成功時)
sub("app/actions/shareCards.ts",
    """    await prisma.shareCard.create({""",
    """    // 報酬体系: シェアクエスト (No.076) + シェア累計 (No.127/146)
    try {
      const { questEventHook, actionCountHook } = await import("@/app/_libs/treasureEngine")
      await questEventHook(dbUser.id, "share_card")
      await actionCountHook(dbUser.id, "share")
    } catch { /* noop */ }
    await prisma.shareCard.create({""",
    "076 share_card + share累計")

# 084 ギャラリーを開く (MyRankCard の演奏の軌跡シート・点灯後はギャラリー3棚になる)
sub("app/components/MyRankCard.tsx",
    """        onClick={() => setOpen(true)}""",
    """        onClick={() => {
          setOpen(true)
          // 報酬体系: ギャラリー閲覧クエスト (No.084・シートが3棚ギャラリーに差し替わる)
          void import("@/app/actions/questEvents").then((m) => m.recordQuestEvent("gallery_open"))
        }}""",
    "084 gallery_open")

# 020 つぎの曲に挑戦 (おすすめカードのタップ)
sub("app/components/RecommendationItem.tsx",
    """    <Link href={href} className={styles.card}>""",
    """    <Link
      href={href}
      className={styles.card}
      onClick={() => {
        // 報酬体系: おすすめ経由クエスト (No.020)
        void import("@/app/actions/questEvents").then((m) => m.recordQuestEvent("next_song"))
      }}
    >""",
    "020 next_song")

import io
def sub(path, old, new):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, path
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new))
    print("ok", path)

sub("app/actions/getSignedUploadUrl.ts",
    """    performanceId = performance.id
    // 報酬体系 (骨組み): 基礎練の初回録音クエスト (冪等・2回目以降は無視される)
    const { questEventHook } = await import("@/app/_libs/treasureEngine")
    await questEventHook(dbUserId, "basics_first")
  }""",
    """    performanceId = performance.id
  }""")

sub("app/actions/uploadRecord.ts",
    """    // 報酬体系 (骨組み): ループ練習クエストの発火 (区間録音の成立)
    const { questEventHook } = await import("@/app/_libs/treasureEngine")
    await questEventHook(dbUser.id, "loop_practice")
  }""",
    """  }""")

sub("app/components/FingerboardPanel.tsx",
    """onClick={() => { setSel(id); void recordQuestEvent("pitch_cell") }}""",
    """onClick={() => setSel(id)}""")

sub("app/components/FingerboardPanel.tsx",
    """onClick={inModal ? undefined : () => { setZoom(true); void recordQuestEvent("fingerboard_zoom") }}""",
    """onClick={inModal ? undefined : () => setZoom(true)}""")

sub("app/components/GoalTracker.tsx",
    """    void import("@/app/actions/questEvents").then((m) => m.recordQuestEvent("trajectory"))
""", "")

sub("app/[userId]/progress/page.tsx",
    """    await questEventHook(dbUser.id, "karte_view")
    await actionCountHook(dbUser.id, "karte_view")""",
    """    await questEventHook(dbUser.id, "karte_view")""")

sub("app/[userId]/_gallery/TreasureDemoClient.tsx",
    """T("card", "rec_10", 34)""",
    """T("card", "tempo_change", 12)""")

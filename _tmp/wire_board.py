# 旧クエストボード差し替え + 旧quests Json読取の点灯時廃止 + 旧進行の遡及移行
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

# 1) evaluateTreasures 初回: 旧チュートリアル進行 (guideState.quests Json) をUserQuestClearへ移行
sub("app/_libs/treasureEngine.ts",
    """  const guideState = await prisma.userGuideState.findUnique({
    where: { userId }, select: { treasureEvaluatedAt: true },
  })
  const firstRun = guideState?.treasureEvaluatedAt == null
""",
    """  const guideState = await prisma.userGuideState.findUnique({
    where: { userId }, select: { treasureEvaluatedAt: true, quests: true },
  })
  const firstRun = guideState?.treasureEvaluatedAt == null

  // 初回のみ: 旧チュートリアル進行 (quests Json・2026-08-29世代) をイベント型クエストへ遡及移行。
  // カウンター型相当 (7日/30日等) は評価器が自力で判定するため対象外
  if (firstRun && guideState?.quests) {
    const OLD_TO_NEW: Record<string, string> = {
      first_loop: "first_loop", annotate: "annotate", lesson: "lesson_first",
      karte: "karte_view", listen_back: "listen_back",
    }
    const oldProgress = guideState.quests as Record<string, unknown>
    for (const [oldId, newId] of Object.entries(OLD_TO_NEW)) {
      if (oldProgress[oldId]) await grantQuest(userId, newId, { silent: true })
    }
  }
""",
    "engine: old progress migration")

# 2) page.tsx: 点灯時は旧quests Jsonを読まず、UserQuestClearから新ボードのデータを渡す
sub("app/[userId]/page.tsx",
    """  const questProgress = (guideState?.completedAt ? (guideState.quests as Record<string, { doneAt: string }>) : null) ?? null""",
    """  // 点灯時は旧quests Json読取を廃止し、UserQuestClear ベースの新ボードに差し替える (2026-08-31)
  const rewardLitHome = process.env.REWARD_SYSTEM_LIT === "1"
  const questProgress = rewardLitHome
    ? null
    : ((guideState?.completedAt ? (guideState.quests as Record<string, { doneAt: string }>) : null) ?? null)""",
    "page: old json gate")

sub("app/[userId]/page.tsx",
    """  // ギャラリー3棚の表示データ (2026-08-31 本結線・点灯前はnull=旧軌跡シートのまま)
  let galleryData: import("../_libs/treasureEngine").GalleryData | null = null""",
    """  // ギャラリー3棚の表示データ (2026-08-31 本結線・点灯前はnull=旧軌跡シートのまま)
  let galleryData: import("../_libs/treasureEngine").GalleryData | null = null
  // 新クエストボード (はじまりの旅) のクリア済みID (点灯時のみ非null)
  let homeQuestClears: string[] | null = null""",
    "page: clears decl")

sub("app/[userId]/page.tsx",
    """        galleryData = await getGalleryData(internalUserId)""",
    """        galleryData = await getGalleryData(internalUserId)
        homeQuestClears = (await prisma.userQuestClear.findMany({
          where: { userId: internalUserId }, select: { questId: true },
        })).map((c) => c.questId)""",
    "page: clears query")

sub("app/[userId]/page.tsx",
    """      questProgress={questProgress}""",
    """      questProgress={questProgress}
      homeQuestClears={homeQuestClears}""",
    "page: clears prop")

# 3) home.tsx: 新ボードの描画 (点灯時) / 旧ボード (未点灯時)
sub("app/[userId]/home.tsx",
    """  questProgress: QuestProgress | null""",
    """  questProgress: QuestProgress | null
  /** 新クエストボードのクリア済みID (報酬体系点灯時のみ非null・旧questProgressと排他) */
  homeQuestClears?: string[] | null""",
    "home: prop type")

sub("app/[userId]/home.tsx",
    """  questProgress,""",
    """  questProgress,
  homeQuestClears,""",
    "home: destructure")

sub("app/[userId]/home.tsx",
    """      {questProgress && <QuestBoard progress={questProgress} />}""",
    """      {homeQuestClears != null
        ? <QuestBoardLit cleared={homeQuestClears} />
        : questProgress && <QuestBoard progress={questProgress} />}""",
    "home: board swap")

sub("app/[userId]/home.tsx",
    """import QuestBoard from "./_guide/QuestBoard\"""",
    """import QuestBoard from "./_guide/QuestBoard"
import QuestBoardLit from "./_gallery/QuestBoardLit\"""",
    "home: import")

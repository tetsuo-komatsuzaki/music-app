# ギャラリー本結線: page → home → MyRankCard シート差し替え (lit時のみ)
import io

def sub(path, old, new, label):
    s = io.open(path, encoding="utf-8").read()
    assert old in s, f"{label}: anchor not found in {path}"
    io.open(path, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("ok", label)

# 1) page.tsx: lit時に galleryData を集めて rankCard に添える
sub("app/[userId]/page.tsx",
    """  let treasureQueue: {
    id: string; kind: string; sourceId: string; catalogNo: number | null; earnedAt: string
    label?: string; stars?: number; certNo?: number
  }[] = []""",
    """  let treasureQueue: {
    id: string; kind: string; sourceId: string; catalogNo: number | null; earnedAt: string
    label?: string; stars?: number; certNo?: number
  }[] = []
  // ギャラリー3棚の表示データ (2026-08-31 本結線・点灯前はnull=旧軌跡シートのまま)
  let galleryData: import("../_libs/treasureEngine").GalleryData | null = null""",
    "page: galleryData decl")

sub("app/[userId]/page.tsx",
    """      const { rewardSystemLit, evaluateTreasures, getTreasureQueue } = await import("../_libs/treasureEngine")
      if (rewardSystemLit()) {
        const perfT0 = performance.now()
        await evaluateTreasures(internalUserId)
        const rows = await getTreasureQueue(internalUserId)""",
    """      const { rewardSystemLit, evaluateTreasures, getTreasureQueue, getGalleryData } = await import("../_libs/treasureEngine")
      if (rewardSystemLit()) {
        const perfT0 = performance.now()
        await evaluateTreasures(internalUserId)
        galleryData = await getGalleryData(internalUserId)
        const rows = await getTreasureQueue(internalUserId)""",
    "page: getGalleryData")

sub("app/[userId]/page.tsx",
    """      rankCard={rankCard}""",
    """      rankCard={{ ...rankCard, gallery: galleryData }}""",
    "page: rankCard gallery")

# 2) home.tsx: prop型に gallery を追加
sub("app/[userId]/home.tsx",
    """  rankCard: {
    currentStar: number
    required: number
    achievedCount: number
    stamps: { scoreId: string; title: string; best: number | null; achievedAt: string | null; href: string }[]
  }""",
    """  rankCard: {
    currentStar: number
    required: number
    achievedCount: number
    stamps: { scoreId: string; title: string; best: number | null; achievedAt: string | null; href: string }[]
    /** ギャラリー3棚 (点灯時のみ非null。軌跡シートを差し替える) */
    gallery?: import("@/app/_libs/treasureEngine").GalleryData | null
  }""",
    "home: prop type")

# 3) MyRankCard: gallery があればシート中身を3棚に差し替え
sub("app/components/MyRankCard.tsx",
    """export default function MyRankCard(props: RankCardData & { onGuide?: () => void; flashAt?: number }) {
  const { currentStar, required, achievedCount, stamps, onGuide, flashAt } = props""",
    """export default function MyRankCard(props: RankCardData & {
  onGuide?: () => void
  flashAt?: number
  /** ギャラリー3棚 (報酬体系点灯時のみ・軌跡シートを差し替える) */
  gallery?: { coins: GalleryCoin[]; treasures: GalleryTreasure[] } | null
}) {
  const { currentStar, required, achievedCount, stamps, onGuide, flashAt, gallery } = props""",
    "rankcard: props")

sub("app/components/MyRankCard.tsx",
    """            <div className={styles.sheetttl}>演奏の軌跡</div>
            {/* モック trace1 (home-06 コインの列) の写経 */}
            <div className={styles.sheetbody}>
""",
    """            {gallery == null && <div className={styles.sheetttl}>演奏の軌跡</div>}
            {/* 点灯後: ギャラリー3棚 (Museum Edition) に差し替え。ヘッダは棚側が持つ */}
            {gallery != null && (
              <div className={styles.sheetbody}>
                <GalleryShelves coins={gallery.coins} required={required} treasures={gallery.treasures} />
              </div>
            )}
            {gallery == null && (<>
            {/* モック trace1 (home-06 コインの列) の写経 */}
            <div className={styles.sheetbody}>
""",
    "rankcard: sheet swap open")

sub("app/components/MyRankCard.tsx",
    """              <div className={ds.card} style={{ padding: "13px 15px" }}>
              </div>

            </div>
          </div>
        </div>,
        document.body,
      )}""",
    """              <div className={ds.card} style={{ padding: "13px 15px" }}>
              </div>

            </div>
            </>)}
          </div>
        </div>,
        document.body,
      )}""",
    "rankcard: sheet swap close")

# 4) MyRankCard: import
sub("app/components/MyRankCard.tsx",
    """import Coin from "./Coin\"""",
    """import Coin from "./Coin"
import GalleryShelves, { type GalleryCoin, type GalleryTreasure } from "@/app/[userId]/_gallery/GalleryShelves\"""",
    "rankcard: import")

# 5) GalleryShelves: シート内でも成立するよう負マージン廃止
sub("app/[userId]/_gallery/GalleryShelves.tsx",
    """  margin:-20px -16px 0; padding:6px 16px 40px; border-radius:0 0 18px 18px; }""",
    """  margin:0; padding:6px 14px 34px; border-radius:18px; }""",
    "shelves: margin")

# 6) デモの余白も合わせる
sub("app/[userId]/_gallery/TreasureDemoClient.tsx",
    """      <div style={{ maxWidth: 402, margin: "0 auto", padding: "20px 16px" }}>""",
    """      <div style={{ maxWidth: 402, margin: "0 auto", padding: "14px 8px" }}>""",
    "demo: padding")

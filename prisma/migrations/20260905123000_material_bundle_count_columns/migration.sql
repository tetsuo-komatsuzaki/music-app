-- 写しの列を漏れなく持たせる (kind/from/to・音の総数・並びの版・束の定義の版・更新日時)。写しなので作り直す。
DROP TABLE "MaterialBundleCount";
CREATE TABLE "MaterialBundleCount" (
    "targetId" TEXT NOT NULL,
    "bundleKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fromValue" TEXT NOT NULL,
    "toValue" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "noteTotal" INTEGER NOT NULL,
    "scoreNoteVersion" TEXT NOT NULL,
    "bundleVersion" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialBundleCount_pkey" PRIMARY KEY ("targetId","bundleKey")
);
CREATE INDEX "MaterialBundleCount_bundleKey_count_idx" ON "MaterialBundleCount"("bundleKey", "count");
CREATE INDEX "MaterialBundleCount_kind_toValue_idx" ON "MaterialBundleCount"("kind", "toValue");

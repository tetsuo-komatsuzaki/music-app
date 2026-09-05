-- 教材側の「束ごとの出現回数」の写し。正は ScoreNote。教材の解析時に書き直す。
CREATE TABLE "MaterialBundleCount" (
    "targetId" TEXT NOT NULL,
    "bundleKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    CONSTRAINT "MaterialBundleCount_pkey" PRIMARY KEY ("targetId","bundleKey")
);
CREATE INDEX "MaterialBundleCount_bundleKey_count_idx" ON "MaterialBundleCount"("bundleKey", "count");

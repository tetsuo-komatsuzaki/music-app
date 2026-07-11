-- 工程F: 特徴タグ・副次調・数値系カラム (2026-07-10, 設計書§14/§19/§20)
-- 追加のみ (additive)。既存カラム・データの変更なし = ロールバックは DROP のみ。

-- ── Score: 数値系カラム追加 ──
ALTER TABLE "Score" ADD COLUMN "pitchMin" INTEGER;
ALTER TABLE "Score" ADD COLUMN "pitchMax" INTEGER;
ALTER TABLE "Score" ADD COLUMN "positions" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- ── PracticeItem: 音域追加 ──
ALTER TABLE "PracticeItem" ADD COLUMN "pitchMin" INTEGER;
ALTER TABLE "PracticeItem" ADD COLUMN "pitchMax" INTEGER;

-- ── ScoreKey: 副次調(転調先)。主調は Score.keyTonic/keyMode が正 ──
CREATE TABLE "ScoreKey" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "keyTonic" TEXT NOT NULL,
    "keyMode" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScoreKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScoreKey_scoreId_keyTonic_keyMode_key" ON "ScoreKey"("scoreId", "keyTonic", "keyMode");
CREATE INDEX "ScoreKey_keyTonic_keyMode_idx" ON "ScoreKey"("keyTonic", "keyMode");

ALTER TABLE "ScoreKey" ADD CONSTRAINT "ScoreKey_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── FeatureTag: 特徴タグ(リスト系) ──
CREATE TABLE "FeatureTag" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "extractRule" TEXT,
    "isAcquisition" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeatureTag_category_name_key" ON "FeatureTag"("category", "name");
CREATE INDEX "FeatureTag_category_idx" ON "FeatureTag"("category");

-- ── ScoreFeatureTag: 曲 ⇔ 特徴タグ M:N ──
CREATE TABLE "ScoreFeatureTag" (
    "scoreId" TEXT NOT NULL,
    "featureTagId" TEXT NOT NULL,

    CONSTRAINT "ScoreFeatureTag_pkey" PRIMARY KEY ("scoreId", "featureTagId")
);

CREATE INDEX "ScoreFeatureTag_featureTagId_idx" ON "ScoreFeatureTag"("featureTagId");

ALTER TABLE "ScoreFeatureTag" ADD CONSTRAINT "ScoreFeatureTag_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScoreFeatureTag" ADD CONSTRAINT "ScoreFeatureTag_featureTagId_fkey" FOREIGN KEY ("featureTagId") REFERENCES "FeatureTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── PracticeItemFeatureTag: 教材 ⇔ 特徴タグ M:N ──
CREATE TABLE "PracticeItemFeatureTag" (
    "practiceItemId" TEXT NOT NULL,
    "featureTagId" TEXT NOT NULL,

    CONSTRAINT "PracticeItemFeatureTag_pkey" PRIMARY KEY ("practiceItemId", "featureTagId")
);

CREATE INDEX "PracticeItemFeatureTag_featureTagId_idx" ON "PracticeItemFeatureTag"("featureTagId");

ALTER TABLE "PracticeItemFeatureTag" ADD CONSTRAINT "PracticeItemFeatureTag_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeItemFeatureTag" ADD CONSTRAINT "PracticeItemFeatureTag_featureTagId_fkey" FOREIGN KEY ("featureTagId") REFERENCES "FeatureTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

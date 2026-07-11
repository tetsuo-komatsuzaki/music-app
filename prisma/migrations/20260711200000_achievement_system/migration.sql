-- 工程D (2026-07-11): 新判定体系（達成/マスター/Star/学びレッスン）
-- 追加のみ・既存テーブル無変更。書き手は loop_engine (Python raw SQL)。

-- 学びレッスン = PracticeItem の新カテゴリ
ALTER TYPE "PracticeCategory" ADD VALUE IF NOT EXISTS 'lesson';

-- 学びレッスンのクリア記録（一度きり・永続・難易度非依存）
CREATE TABLE "UserLessonClear" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagType" TEXT NOT NULL,
    "tagKey" TEXT NOT NULL,
    "lessonItemId" TEXT,
    "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLessonClear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserLessonClear_userId_tagType_tagKey_key"
    ON "UserLessonClear"("userId", "tagType", "tagKey");
CREATE INDEX "UserLessonClear_userId_idx" ON "UserLessonClear"("userId");

ALTER TABLE "UserLessonClear"
    ADD CONSTRAINT "UserLessonClear_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 曲の達成/マスター記録
CREATE TABLE "UserScoreAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "starAtAchievement" INTEGER NOT NULL,
    "masteredAt" TIMESTAMP(3),
    "achievedPerformanceId" TEXT,

    CONSTRAINT "UserScoreAchievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserScoreAchievement_userId_scoreId_key"
    ON "UserScoreAchievement"("userId", "scoreId");
CREATE INDEX "UserScoreAchievement_userId_starAtAchievement_idx"
    ON "UserScoreAchievement"("userId", "starAtAchievement");

ALTER TABLE "UserScoreAchievement"
    ADD CONSTRAINT "UserScoreAchievement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserScoreAchievement"
    ADD CONSTRAINT "UserScoreAchievement_scoreId_fkey"
    FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 教材の達成記録
CREATE TABLE "UserPracticeAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPracticeAchievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPracticeAchievement_userId_practiceItemId_key"
    ON "UserPracticeAchievement"("userId", "practiceItemId");
CREATE INDEX "UserPracticeAchievement_userId_idx" ON "UserPracticeAchievement"("userId");

ALTER TABLE "UserPracticeAchievement"
    ADD CONSTRAINT "UserPracticeAchievement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPracticeAchievement"
    ADD CONSTRAINT "UserPracticeAchievement_practiceItemId_fkey"
    FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Star の現在地
CREATE TABLE "UserStarProgress" (
    "userId" TEXT NOT NULL,
    "currentStar" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStarProgress_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserStarProgress"
    ADD CONSTRAINT "UserStarProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

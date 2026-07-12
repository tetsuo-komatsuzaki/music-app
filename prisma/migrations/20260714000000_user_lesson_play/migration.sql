-- 学びレッスンの演奏回数テーブル (学びレッスン確定#3 2026-07-14)
-- 端末内発音チェック合格の報告を数える。追加のみ・既存データ影響なし。

-- CreateTable
CREATE TABLE "UserLessonPlay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLessonPlay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserLessonPlay_userId_practiceItemId_key"
  ON "UserLessonPlay"("userId", "practiceItemId");

-- AddForeignKey
ALTER TABLE "UserLessonPlay" ADD CONSTRAINT "UserLessonPlay_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonPlay" ADD CONSTRAINT "UserLessonPlay_practiceItemId_fkey"
  FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

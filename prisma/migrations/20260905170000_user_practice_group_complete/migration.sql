-- 教材グループのコンプリート (奏法 / リズム バリエーション全クリア) ・ 2026-09-05 Tetsuo確定
CREATE TABLE "UserPracticeGroupComplete" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "variantCount" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPracticeGroupComplete_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPracticeGroupComplete_userId_groupId_kind_key" ON "UserPracticeGroupComplete"("userId", "groupId", "kind");
CREATE INDEX "UserPracticeGroupComplete_userId_completedAt_idx" ON "UserPracticeGroupComplete"("userId", "completedAt");
ALTER TABLE "UserPracticeGroupComplete" ADD CONSTRAINT "UserPracticeGroupComplete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPracticeGroupComplete" ADD CONSTRAINT "UserPracticeGroupComplete_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MaterialGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

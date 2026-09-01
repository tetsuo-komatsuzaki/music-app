-- わざマスターの課題曲 (2026-09-01 Tetsuo確定)
CREATE TABLE "SkillMasterySong" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "star" INTEGER NOT NULL,
    "scoreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillMasterySong_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillMasterySong_skillId_star_key" ON "SkillMasterySong"("skillId", "star");
CREATE INDEX "SkillMasterySong_scoreId_idx" ON "SkillMasterySong"("scoreId");

ALTER TABLE "SkillMasterySong" ADD CONSTRAINT "SkillMasterySong_scoreId_fkey"
  FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

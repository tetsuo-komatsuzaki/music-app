-- v1.3 Phase 3c (2026-05-16, Tetsuo Q4=B 確定)
-- 完全習得判定 (§2-6) で「全演奏技法習得」を判定するために Score 自身に紐づく
-- TechniqueTag 集合が必要。PracticeItemTechnique と同じ M2M 構造で追加。

-- CreateTable
CREATE TABLE "ScoreTechniqueTag" (
    "scoreId" TEXT NOT NULL,
    "techniqueTagId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScoreTechniqueTag_pkey" PRIMARY KEY ("scoreId","techniqueTagId")
);

-- CreateIndex
CREATE INDEX "ScoreTechniqueTag_techniqueTagId_idx" ON "ScoreTechniqueTag"("techniqueTagId");

-- AddForeignKey
ALTER TABLE "ScoreTechniqueTag" ADD CONSTRAINT "ScoreTechniqueTag_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "Score"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreTechniqueTag" ADD CONSTRAINT "ScoreTechniqueTag_techniqueTagId_fkey" FOREIGN KEY ("techniqueTagId") REFERENCES "TechniqueTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

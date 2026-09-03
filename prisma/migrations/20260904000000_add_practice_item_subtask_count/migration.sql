-- CreateTable
CREATE TABLE "PracticeItemSubtaskCount" (
    "id" TEXT NOT NULL,
    "practiceItemId" TEXT NOT NULL,
    "subtaskId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "noteTotal" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeItemSubtaskCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeItemSubtaskCount_subtaskId_count_idx" ON "PracticeItemSubtaskCount"("subtaskId", "count");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeItemSubtaskCount_practiceItemId_subtaskId_key" ON "PracticeItemSubtaskCount"("practiceItemId", "subtaskId");

-- AddForeignKey
ALTER TABLE "PracticeItemSubtaskCount" ADD CONSTRAINT "PracticeItemSubtaskCount_practiceItemId_fkey" FOREIGN KEY ("practiceItemId") REFERENCES "PracticeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('SONG', 'ETUDE', 'SCALE', 'ARPEGGIO', 'FINGERING', 'BOWING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "PracticeItem" ADD COLUMN     "articulation" TEXT,
ADD COLUMN     "difficulty" "Difficulty",
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "sections" JSONB;

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "difficulty" "Difficulty",
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "sections" JSONB;

-- CreateTable
CREATE TABLE "MaterialGroup" (
    "id" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "composer" TEXT,
    "genre" TEXT,
    "coverImagePath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialGroup_kind_category_idx" ON "MaterialGroup"("kind", "category");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MaterialGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeItem" ADD CONSTRAINT "PracticeItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MaterialGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;


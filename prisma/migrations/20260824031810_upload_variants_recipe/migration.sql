-- AlterTable
ALTER TABLE "PracticeItem" ADD COLUMN     "articulationRecipe" JSONB;

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "partId" TEXT,
ADD COLUMN     "variantRecipe" JSONB;

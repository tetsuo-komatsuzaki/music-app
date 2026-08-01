-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "career" TEXT,
ADD COLUMN     "lessonStyle" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "ages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[];

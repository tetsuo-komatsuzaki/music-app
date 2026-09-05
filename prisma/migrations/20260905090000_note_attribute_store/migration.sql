-- ノート属性ストア (2026-09-05 Tetsuo確定): 1音ごとの属性で数えるための正となる3表 + 演奏側の版列。集計は保存せず読むときに明細から作る。
-- 生成: prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
-- CreateEnum
CREATE TYPE "ScoreNoteTarget" AS ENUM ('score', 'practice');
-- CreateEnum
CREATE TYPE "PerformanceKind" AS ENUM ('score', 'practice');
-- AlterTable
ALTER TABLE "Performance" ADD COLUMN     "scoreNoteVersion" TEXT;
-- AlterTable
ALTER TABLE "PracticePerformance" ADD COLUMN     "scoreNoteVersion" TEXT;
-- CreateTable
CREATE TABLE "NoteProfile" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "noteCount" INTEGER NOT NULL,
    "pitch1" TEXT NOT NULL,
    "pitch2" TEXT NOT NULL,
    "pitch3" TEXT NOT NULL,
    "pitch4" TEXT NOT NULL,
    "string1" TEXT NOT NULL,
    "string2" TEXT NOT NULL,
    "string3" TEXT NOT NULL,
    "string4" TEXT NOT NULL,
    "finger1" INTEGER NOT NULL,
    "finger2" INTEGER NOT NULL,
    "finger3" INTEGER NOT NULL,
    "finger4" INTEGER NOT NULL,
    "noteType1" TEXT NOT NULL,
    "noteType2" TEXT NOT NULL,
    "noteType3" TEXT NOT NULL,
    "noteType4" TEXT NOT NULL,
    "dotted1" BOOLEAN NOT NULL,
    "dotted2" BOOLEAN NOT NULL,
    "dotted3" BOOLEAN NOT NULL,
    "dotted4" BOOLEAN NOT NULL,
    "durationBeats1" DOUBLE PRECISION NOT NULL,
    "durationBeats2" DOUBLE PRECISION NOT NULL,
    "durationBeats3" DOUBLE PRECISION NOT NULL,
    "durationBeats4" DOUBLE PRECISION NOT NULL,
    "position" INTEGER NOT NULL,
    "techSlur" BOOLEAN NOT NULL,
    "techPortato" BOOLEAN NOT NULL,
    "techStaccato" BOOLEAN NOT NULL,
    "techBowStaccato" BOOLEAN NOT NULL,
    "techSpiccato" BOOLEAN NOT NULL,
    "techRicochet" BOOLEAN NOT NULL,
    "techPizzicato" BOOLEAN NOT NULL,
    "techTremolo" BOOLEAN NOT NULL,
    "techVibrato" BOOLEAN NOT NULL,
    "techTrill" BOOLEAN NOT NULL,
    "techMordent" BOOLEAN NOT NULL,
    "techGlissando" BOOLEAN NOT NULL,
    "techHarmonic" BOOLEAN NOT NULL,
    "tupletActual" INTEGER NOT NULL,
    "tupletNormal" INTEGER NOT NULL,
    "onBeat" BOOLEAN NOT NULL,
    "chordCont" BOOLEAN NOT NULL,
    "restBefore" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "NoteProfile_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ScoreNote" (
    "targetType" "ScoreNoteTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "noteIndex" INTEGER NOT NULL,
    "writtenNoteIndex" INTEGER NOT NULL,
    "measure" INTEGER NOT NULL,
    "pass" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "prevProfileId" INTEGER,
    "durationSec" DOUBLE PRECISION,
    "beatOffset" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "ScoreNote_pkey" PRIMARY KEY ("targetType","targetId","noteIndex")
);
-- CreateTable
CREATE TABLE "PerformanceNote" (
    "performanceKind" "PerformanceKind" NOT NULL,
    "performanceId" TEXT NOT NULL,
    "noteIndex" INTEGER NOT NULL,
    "measureNumber" INTEGER,
    "noteName" TEXT,
    "pitchOk" BOOLEAN,
    "startOk" BOOLEAN,
    "evaluationStatus" TEXT NOT NULL,
    "pitchCentsError" DOUBLE PRECISION,
    "startDiffSec" DOUBLE PRECISION,
    "expectedStartSec" DOUBLE PRECISION,
    "expectedEndSec" DOUBLE PRECISION,
    "expectedPitchHz" DOUBLE PRECISION,
    "detectedStartSec" DOUBLE PRECISION,
    "detectedEndSec" DOUBLE PRECISION,
    "detectedPitchHz" DOUBLE PRECISION,
    "timingFromStartSec" DOUBLE PRECISION,
    "matchConfidence" DOUBLE PRECISION,
    "validFrames" INTEGER,
    "globalShiftSec" DOUBLE PRECISION,
    "currentShiftSec" DOUBLE PRECISION,
    "onsetCountInNote" INTEGER,
    "onsetRatePerSec" DOUBLE PRECISION,
    "pitchAltCount" INTEGER,
    "pitchAltSemitones" DOUBLE PRECISION,
    "ampStrokeCount" INTEGER,
    "attackPeakFrac" DOUBLE PRECISION,
    "decayRatio" DOUBLE PRECISION,
    "glissRangeSemitones" DOUBLE PRECISION,
    "glissMonotonicFrac" DOUBLE PRECISION,
    "glissDirection" TEXT,
    "expectedHz1" DOUBLE PRECISION,
    "expectedHz2" DOUBLE PRECISION,
    "expectedHz3" DOUBLE PRECISION,
    "expectedHz4" DOUBLE PRECISION,
    "detectedHz1" DOUBLE PRECISION,
    "detectedHz2" DOUBLE PRECISION,
    "detectedHz3" DOUBLE PRECISION,
    "detectedHz4" DOUBLE PRECISION,
    "cents1" DOUBLE PRECISION,
    "cents2" DOUBLE PRECISION,
    "cents3" DOUBLE PRECISION,
    "cents4" DOUBLE PRECISION,
    "pitchOk1" BOOLEAN,
    "pitchOk2" BOOLEAN,
    "pitchOk3" BOOLEAN,
    "pitchOk4" BOOLEAN,
    "presenceOk1" BOOLEAN,
    "presenceOk2" BOOLEAN,
    "presenceOk3" BOOLEAN,
    "presenceOk4" BOOLEAN,
    "playedSec" DOUBLE PRECISION,
    "durRatio" DOUBLE PRECISION,
    CONSTRAINT "PerformanceNote_pkey" PRIMARY KEY ("performanceKind","performanceId","noteIndex")
);
-- CreateIndex
CREATE UNIQUE INDEX "NoteProfile_key_key" ON "NoteProfile"("key");
-- CreateIndex
CREATE INDEX "NoteProfile_pitch1_idx" ON "NoteProfile"("pitch1");
-- CreateIndex
CREATE INDEX "NoteProfile_position_idx" ON "NoteProfile"("position");
-- CreateIndex
CREATE INDEX "ScoreNote_targetType_targetId_idx" ON "ScoreNote"("targetType", "targetId");
-- CreateIndex
CREATE INDEX "ScoreNote_profileId_idx" ON "ScoreNote"("profileId");
-- CreateIndex
CREATE INDEX "ScoreNote_prevProfileId_profileId_idx" ON "ScoreNote"("prevProfileId", "profileId");
-- CreateIndex
CREATE INDEX "PerformanceNote_performanceId_idx" ON "PerformanceNote"("performanceId");
-- AddForeignKey
ALTER TABLE "ScoreNote" ADD CONSTRAINT "ScoreNote_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "NoteProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ScoreNote" ADD CONSTRAINT "ScoreNote_prevProfileId_fkey" FOREIGN KEY ("prevProfileId") REFERENCES "NoteProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

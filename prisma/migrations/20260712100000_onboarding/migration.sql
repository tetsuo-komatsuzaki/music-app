-- オンボーディング C5 (2026-07-12): 回答保存・仮習得・曲リクエスト・曲カタログ
-- 追加のみ・既存テーブル変更は User への nullable 列1本のみ。

-- 診断予約 (意味: 初回演奏時に仮習得を検証する予約。常時診断は工程Cで充足済み)
ALTER TABLE "User" ADD COLUMN "diagnosisReservedAt" TIMESTAMP(3);

-- オンボーディング回答（ドラフト + 完了記録）
CREATE TABLE "OnboardingProfile" (
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "ladder" JSONB NOT NULL DEFAULT '{}',
    "screen" TEXT,
    "seg" JSONB NOT NULL DEFAULT '{}',
    "star" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProfile_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "OnboardingProfile"
    ADD CONSTRAINT "OnboardingProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 仮習得3状態 (PROVISIONAL | CONFIRMED | REVOKED)
CREATE TABLE "UserTagAcquisition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagType" TEXT NOT NULL,
    "tagKey" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PROVISIONAL',
    "source" TEXT NOT NULL DEFAULT 'onboarding',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTagAcquisition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTagAcquisition_userId_tagType_tagKey_key"
    ON "UserTagAcquisition"("userId", "tagType", "tagKey");

ALTER TABLE "UserTagAcquisition"
    ADD CONSTRAINT "UserTagAcquisition_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 未収録曲リクエスト
CREATE TABLE "SongRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songName" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'onboarding',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SongRequest_songName_idx" ON "SongRequest"("songName");

ALTER TABLE "SongRequest"
    ADD CONSTRAINT "SongRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 曲カタログ v1.0
CREATE TABLE "OnboardingSong" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "star" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OnboardingSong_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingSong_category_name_key"
    ON "OnboardingSong"("category", "name");

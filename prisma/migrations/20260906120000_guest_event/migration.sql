-- ゲストの計測 (2026-09-06): 訪問 ・ シートが出た場所 ・ 登録/ログインへ進んだ回数。個人は持たない
CREATE TABLE "GuestEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GuestEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuestEvent_createdAt_idx" ON "GuestEvent"("createdAt");
CREATE INDEX "GuestEvent_kind_place_idx" ON "GuestEvent"("kind", "place");

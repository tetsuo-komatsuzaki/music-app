-- シェア機能 (2026-08-03): ShareCard = SNS公開リンクの実体
CREATE TABLE "ShareCard" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "displayName" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShareCard_token_key" ON "ShareCard"("token");

CREATE INDEX "ShareCard_userId_createdAt_idx" ON "ShareCard"("userId", "createdAt");

ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

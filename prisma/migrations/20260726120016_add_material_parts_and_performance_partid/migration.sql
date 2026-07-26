-- パート分け (2026-07-26): 加算・null許容のみ。既存データに無害。
-- MaterialGroup.parts = 曲の「◯小節〜◯小節=Part」範囲リスト (難易度共通・任意個)。
-- Performance.partId  = 区間録音がどのパートか (パート別 自己ベスト/推移の集計キー)。
ALTER TABLE "MaterialGroup" ADD COLUMN "parts" JSONB;
ALTER TABLE "Performance" ADD COLUMN "partId" TEXT;

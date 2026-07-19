-- achievement-status / score-performances の (userId, scoreId) 絞り + uploadedAt 並べ替え hot path 用の複合インデックス。
-- CreateIndex
CREATE INDEX "Performance_userId_scoreId_uploadedAt_idx" ON "Performance"("userId", "scoreId", "uploadedAt");

-- CreateTable
CREATE TABLE "speech_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "promptText" TEXT,
    "transcript" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "wpm" DOUBLE PRECISION NOT NULL,
    "fillerWords" JSONB NOT NULL,
    "pauseCount" INTEGER NOT NULL,
    "longPauseCount" INTEGER NOT NULL,
    "avgPauseMs" DOUBLE PRECISION NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "clarityScore" INTEGER NOT NULL,
    "paceScore" INTEGER NOT NULL,
    "vocalVarietyScore" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speech_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_feedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "actionPlan" JSONB NOT NULL,
    "practiceDrills" JSONB NOT NULL,
    "motivationalNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "speech_sessions_userId_idx" ON "speech_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coaching_feedback_sessionId_key" ON "coaching_feedback"("sessionId");

-- AddForeignKey
ALTER TABLE "speech_sessions" ADD CONSTRAINT "speech_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_feedback" ADD CONSTRAINT "coaching_feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "speech_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

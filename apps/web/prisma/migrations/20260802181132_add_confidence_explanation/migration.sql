/*
  Warnings:

  - Added the required column `confidenceExplanation` to the `speech_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "speech_sessions" ADD COLUMN     "confidenceExplanation" JSONB NOT NULL;

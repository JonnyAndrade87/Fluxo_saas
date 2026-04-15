-- AlterTable without data loss
-- Converts String metadata to Jsonb using casting
ALTER TABLE "activity_logs" 
ALTER COLUMN "metadata" TYPE JSONB USING "metadata"::JSONB;

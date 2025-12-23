-- ============================================================================
-- COMPREHENSIVE UPDATES MIGRATION
-- ============================================================================
-- Changes:
-- 1. Update Panelist model: roleType → primaryRole + secondaryRole + expertiseArea + jurisdictionContext
-- 2. Update PanelistRole enum: Remove EXPERT_MEASUREMENT, Add MEDICAL_PROFESSIONAL
-- 3. Update Response model: Add generalComments field
-- 4. Update Study model: Change consensusThreshold default from 1.0 to 0.67
-- 5. Convert existing response ratings from 1-5 scale to 1-3 scale

-- ============================================================================
-- STEP 1: Add new columns to panelists table
-- ============================================================================
ALTER TABLE "panelists"
  ADD COLUMN "primaryRole" TEXT,
  ADD COLUMN "secondaryRole" TEXT,
  ADD COLUMN "expertiseArea" TEXT,
  ADD COLUMN "jurisdictionContext" TEXT;

-- ============================================================================
-- STEP 2: Migrate existing data from roleType to primaryRole
-- ============================================================================

-- For EXPERT_MEASUREMENT users, set primaryRole to EXPERT_GBV and preserve expertise
UPDATE "panelists"
SET
  "primaryRole" = 'EXPERT_GBV',
  "expertiseArea" = 'Indicator & Composite Development'
WHERE "roleType" = 'EXPERT_MEASUREMENT';

-- For all other users, simply copy roleType to primaryRole
UPDATE "panelists"
SET "primaryRole" = "roleType"
WHERE "roleType" != 'EXPERT_MEASUREMENT' OR "roleType" IS NULL;

-- ============================================================================
-- STEP 3: Set primaryRole as NOT NULL
-- ============================================================================
ALTER TABLE "panelists"
  ALTER COLUMN "primaryRole" SET NOT NULL;

-- ============================================================================
-- STEP 4: Drop old roleType column
-- ============================================================================
ALTER TABLE "panelists"
  DROP COLUMN "roleType";

-- ============================================================================
-- STEP 5: Update PanelistRole enum
-- ============================================================================
-- Drop the old enum value and add new one
-- This is done by creating a new enum, updating references, and dropping the old enum

CREATE TYPE "PanelistRole_new" AS ENUM (
  'EXPERT_GBV',
  'LIVED_EXPERIENCE',
  'SERVICE_PROVIDER',
  'POLICY_MAKER',
  'COMMUNITY_MEMBER',
  'MEDICAL_PROFESSIONAL'
);

ALTER TABLE "panelists"
  ALTER COLUMN "primaryRole" TYPE "PanelistRole_new" USING ("primaryRole"::text::"PanelistRole_new"),
  ALTER COLUMN "secondaryRole" TYPE "PanelistRole_new" USING ("secondaryRole"::text::"PanelistRole_new");

DROP TYPE "PanelistRole";
ALTER TYPE "PanelistRole_new" RENAME TO "PanelistRole";

-- ============================================================================
-- STEP 6: Add generalComments field to responses table
-- ============================================================================
ALTER TABLE "responses"
  ADD COLUMN "generalComments" TEXT;

-- ============================================================================
-- STEP 7: Convert ratings from 1-5 scale to 1-3 scale
-- ============================================================================
-- Mapping: 1-2 → 1 (Low), 3 → 2 (Medium), 4-5 → 3 (High)
-- This preserves relative rankings and consensus patterns

UPDATE "responses"
SET
  "priorityRating" = CASE
    WHEN "priorityRating" IN (1, 2) THEN 1
    WHEN "priorityRating" = 3 THEN 2
    WHEN "priorityRating" IN (4, 5) THEN 3
    ELSE "priorityRating"
  END,
  "operationalizationValidity" = CASE
    WHEN "operationalizationValidity" IN (1, 2) THEN 1
    WHEN "operationalizationValidity" = 3 THEN 2
    WHEN "operationalizationValidity" IN (4, 5) THEN 3
    ELSE "operationalizationValidity"
  END,
  "feasibilityRating" = CASE
    WHEN "feasibilityRating" IN (1, 2) THEN 1
    WHEN "feasibilityRating" = 3 THEN 2
    WHEN "feasibilityRating" IN (4, 5) THEN 3
    ELSE "feasibilityRating"
  END
WHERE "priorityRating" IS NOT NULL
   OR "operationalizationValidity" IS NOT NULL
   OR "feasibilityRating" IS NOT NULL;

-- ============================================================================
-- STEP 8: Update consensus threshold for existing studies
-- ============================================================================
UPDATE "studies"
SET "consensusThreshold" = 0.67
WHERE "consensusThreshold" = 1.0;

-- ============================================================================
-- STEP 9: Recalculate round summaries (delete existing, will be regenerated)
-- ============================================================================
DELETE FROM "round_summaries";

-- ============================================================================
-- STEP 10: Add audit log entries
-- ============================================================================
INSERT INTO "audit_logs" ("id", "action", "actorType", "metadata", "createdAt")
VALUES (
  gen_random_uuid(),
  'SCHEMA_MIGRATION',
  'SYSTEM',
  '{"migration": "comprehensive_updates", "changes": ["roleType→primaryRole+secondaryRole", "remove EXPERT_MEASUREMENT", "add MEDICAL_PROFESSIONAL", "add expertiseArea+jurisdictionContext", "add generalComments", "convert 1-5 to 1-3 scale", "update consensusThreshold 1.0→0.67"]}',
  NOW()
);

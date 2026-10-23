CREATE TABLE IF NOT EXISTS "FinanceCategorySetting" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    CONSTRAINT "FinanceCategorySetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinanceCategorySetting_workspaceId_name_key" ON "FinanceCategorySetting"("workspaceId", "name");
CREATE INDEX IF NOT EXISTS "FinanceCategorySetting_workspaceId_idx" ON "FinanceCategorySetting"("workspaceId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinanceCategorySetting_workspaceId_fkey') THEN
    ALTER TABLE "FinanceCategorySetting" ADD CONSTRAINT "FinanceCategorySetting_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

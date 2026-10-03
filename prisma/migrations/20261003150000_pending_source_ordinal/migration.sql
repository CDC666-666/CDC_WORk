ALTER TABLE "MigrationPending" ADD COLUMN "sourceOrdinal" INTEGER NOT NULL;
DROP INDEX "MigrationPending_batchId_collection_sourceId_key";
CREATE UNIQUE INDEX "MigrationPending_batchId_collection_sourceId_sourceOrdinal_key"
  ON "MigrationPending"("batchId", "collection", "sourceId", "sourceOrdinal");

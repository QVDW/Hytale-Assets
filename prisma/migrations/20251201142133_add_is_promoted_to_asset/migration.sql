-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "is_promoted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "assets_is_promoted_idx" ON "assets"("is_promoted");

-- CreateEnum
CREATE TYPE "OverviewSectionType" AS ENUM ('image', 'youtube', 'text');

-- CreateTable
CREATE TABLE "asset_overview_sections" (
    "section_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "section_type" "OverviewSectionType" NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_overview_sections_pkey" PRIMARY KEY ("section_id")
);

-- CreateIndex
CREATE INDEX "asset_overview_sections_asset_id_idx" ON "asset_overview_sections"("asset_id");

-- CreateIndex
CREATE INDEX "asset_overview_sections_asset_id_order_idx" ON "asset_overview_sections"("asset_id", "order");

-- AddForeignKey
ALTER TABLE "asset_overview_sections" ADD CONSTRAINT "asset_overview_sections_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

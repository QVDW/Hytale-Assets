-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('active', 'removed');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewed', 'resolved');

-- CreateTable
CREATE TABLE "categories" (
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_category_id" TEXT,
    "description" TEXT,
    "icon_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "assets" (
    "asset_id" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "preview_url" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_update" TIMESTAMP(3) NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "status" "AssetStatus" NOT NULL DEFAULT 'approved',
    "compatibility" TEXT,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "asset_versions" (
    "version_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "version_number" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "changelog" TEXT,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_versions_pkey" PRIMARY KEY ("version_id")
);

-- CreateTable
CREATE TABLE "downloads" (
    "download_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "download_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("download_id")
);

-- CreateTable
CREATE TABLE "likes" (
    "like_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "liked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("like_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "review_text" TEXT NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReviewStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "favorite_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "favorited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("favorite_id")
);

-- CreateTable
CREATE TABLE "asset_reports" (
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',

    CONSTRAINT "asset_reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "asset_metadata" (
    "metadata_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "asset_metadata_pkey" PRIMARY KEY ("metadata_id")
);

-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "categories"("parent_category_id");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE INDEX "assets_uploader_id_idx" ON "assets"("uploader_id");

-- CreateIndex
CREATE INDEX "assets_category_id_idx" ON "assets"("category_id");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_upload_date_idx" ON "assets"("upload_date" DESC);

-- CreateIndex
CREATE INDEX "assets_download_count_idx" ON "assets"("download_count" DESC);

-- CreateIndex
CREATE INDEX "asset_versions_asset_id_idx" ON "asset_versions"("asset_id");

-- CreateIndex
CREATE INDEX "asset_versions_upload_date_idx" ON "asset_versions"("upload_date" DESC);

-- CreateIndex
CREATE INDEX "downloads_user_id_idx" ON "downloads"("user_id");

-- CreateIndex
CREATE INDEX "downloads_asset_id_idx" ON "downloads"("asset_id");

-- CreateIndex
CREATE INDEX "downloads_download_date_idx" ON "downloads"("download_date" DESC);

-- CreateIndex
CREATE INDEX "likes_asset_id_idx" ON "likes"("asset_id");

-- CreateIndex
CREATE INDEX "likes_liked_at_idx" ON "likes"("liked_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_asset_id_key" ON "likes"("user_id", "asset_id");

-- CreateIndex
CREATE INDEX "reviews_asset_id_idx" ON "reviews"("asset_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_review_date_idx" ON "reviews"("review_date" DESC);

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites"("user_id");

-- CreateIndex
CREATE INDEX "user_favorites_asset_id_idx" ON "user_favorites"("asset_id");

-- CreateIndex
CREATE INDEX "user_favorites_favorited_at_idx" ON "user_favorites"("favorited_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_asset_id_key" ON "user_favorites"("user_id", "asset_id");

-- CreateIndex
CREATE INDEX "asset_reports_asset_id_idx" ON "asset_reports"("asset_id");

-- CreateIndex
CREATE INDEX "asset_reports_user_id_idx" ON "asset_reports"("user_id");

-- CreateIndex
CREATE INDEX "asset_reports_status_idx" ON "asset_reports"("status");

-- CreateIndex
CREATE INDEX "asset_reports_report_date_idx" ON "asset_reports"("report_date" DESC);

-- CreateIndex
CREATE INDEX "asset_metadata_asset_id_idx" ON "asset_metadata"("asset_id");

-- CreateIndex
CREATE INDEX "asset_metadata_key_idx" ON "asset_metadata"("key");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "user_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_reports" ADD CONSTRAINT "asset_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_reports" ADD CONSTRAINT "asset_reports_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_metadata" ADD CONSTRAINT "asset_metadata_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

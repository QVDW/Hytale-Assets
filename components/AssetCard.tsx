"use client";

import Image from "next/image";
import Link from "next/link";
import type { DiscoveryAsset } from "../src/hooks/useTopAssets";

interface AssetCardProps {
  asset: DiscoveryAsset;
  index?: number;
}

export default function AssetCard({ asset, index }: AssetCardProps) {
  const thumbnail =
    asset.preview_url || "/asset-thumbnails/essentials.jpg";

  const rankNumber =
    typeof index === "number" ? index + 1 : undefined;

  return (
    <Link
      href={`/assets/${asset.asset_id}`}
      className="home-discovery-card"
      aria-label={`View asset ${asset.title}`}
    >
      <div className="home-discovery-card-media">
        {typeof rankNumber === "number" && (
          <div className="home-discovery-card-rank">
            <span>{rankNumber}</span>
          </div>
        )}

        <Image
          src={thumbnail}
          alt={asset.title}
          fill
          sizes="(max-width: 768px) 60vw, 220px"
          className="home-discovery-card-image"
          onError={(e) => {
            e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
          }}
        />
      </div>

      <div className="home-discovery-card-body">
        <h3 className="home-discovery-card-title">
          {asset.title}
        </h3>
        <div className="home-discovery-card-meta">
          {asset.category?.name && (
            <span className="home-discovery-card-pill">
              {asset.category.name}
            </span>
          )}
          <span className="home-discovery-card-pill home-discovery-card-pill-subtle">
            {asset.download_count.toLocaleString()} downloads
          </span>
        </div>
      </div>
    </Link>
  );
}



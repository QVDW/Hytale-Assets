"use client";

import Image from "next/image";
import Link from "next/link";
import type { DiscoveryAsset } from "../src/hooks/useTopAssets";
import AssetTitle from "./AssetTitle";

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
          <AssetTitle
            title={asset.title}
            logoUrl={asset.logo_url}
            visuallyHideText
          />
        </h3>
      </div>
    </Link>
  );
}



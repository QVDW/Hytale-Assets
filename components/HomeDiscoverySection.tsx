"use client";

import { useTopAssets } from "../src/hooks/useTopAssets";
import AssetRowCarousel from "./AssetRowCarousel";

export default function HomeDiscoverySection() {
  const {
    assets: topAssets,
    isLoading,
    error,
  } = useTopAssets({ limit: 10, fetchLimit: 40 });

  if (isLoading) {
    return (
      <section className="home-discovery-section">
        <div className="home-discovery-section-inner">
          <div className="home-discovery-row-skeleton" />
        </div>
      </section>
    );
  }

  if (error || !topAssets.length) {
    return null;
  }

  return (
    <section className="home-discovery-section">
      <div className="home-discovery-section-inner">
        <AssetRowCarousel
          title="Top 10 Most Downloaded"
          subtitle="A rotating pick of the most downloaded assets across every category."
          assets={topAssets}
          rowId="top-10-most-downloaded"
        />

        <AssetRowCarousel
          title="Because the community loves these"
          subtitle="More popular downloads you might want to check out."
          assets={[...topAssets]
            .slice()
            .reverse()}
          rowId="community-favorites"
        />
      </div>
    </section>
  );
}



"use client";

import { useRef } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import type { DiscoveryAsset } from "../src/hooks/useTopAssets";
import AssetCard from "./AssetCard";

interface AssetRowCarouselProps {
  title: string;
  subtitle?: string;
  assets: DiscoveryAsset[];
  rowId?: string;
}

export default function AssetRowCarousel({
  title,
  subtitle,
  assets,
  rowId,
}: AssetRowCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.9;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (!assets.length) {
    return null;
  }

  return (
    <section
      className="home-discovery-row"
      aria-label={title}
      id={rowId}
    >
      <div className="home-discovery-row-header">
        <div className="home-discovery-row-titles">
          <h2 className="home-discovery-row-title">
            {title}
          </h2>
          {subtitle && (
            <p className="home-discovery-row-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        <div className="home-discovery-row-controls">
          <button
            type="button"
            className="home-discovery-arrow home-discovery-arrow-left"
            aria-label={`Scroll ${title} left`}
            onClick={() => handleScroll("left")}
          >
            <MdChevronLeft />
          </button>
          <button
            type="button"
            className="home-discovery-arrow home-discovery-arrow-right"
            aria-label={`Scroll ${title} right`}
            onClick={() => handleScroll("right")}
          >
            <MdChevronRight />
          </button>
        </div>
      </div>

      <div className="home-discovery-row-body">
        <div
          ref={scrollRef}
          className="home-discovery-scroll-container"
        >
          <div className="home-discovery-items">
            {assets.map((asset, index) => (
              <div
                key={asset.asset_id}
                className="home-discovery-item"
              >
                <AssetCard asset={asset} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const HERO_ROTATION_INTERVAL_MS = 10000;
const HERO_MAX_ASSETS = 4;

interface HeroAsset {
  asset_id: string;
  title: string;
  description: string;
  preview_url: string | null;
  download_count: number;
  isPromoted?: boolean;
  screenshots?: string[];
}

interface AssetsApiAsset {
  asset_id: string;
  title: string;
  description: string;
  preview_url: string | null;
  download_count: number;
  isPromoted?: boolean;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getFallbackPreview(asset: HeroAsset): string {
  return (
    asset.preview_url ||
    (asset.screenshots && asset.screenshots[0]) ||
    "/asset-thumbnails/essentials.jpg"
  );
}

function getPrimaryScreenshot(asset: HeroAsset): string {
  if (asset.screenshots && asset.screenshots.length > 0) {
    return asset.screenshots[0];
  }
  return getFallbackPreview(asset);
}

function truncateDescription(text: string, maxChars = 160): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

export default function HomeHero() {
  const [assets, setAssets] = useState<HeroAsset[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [rotationStart, setRotationStart] = useState<number | null>(null);
  const [rotationProgress, setRotationProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAssets = async () => {
      setIsLoading(true);

      const promotedData = await fetchJson<{ assets: AssetsApiAsset[] }>(
        `/api/assets?isPromoted=true&limit=${HERO_MAX_ASSETS}`
      );
      const promoted = promotedData?.assets ?? [];

      let combined: AssetsApiAsset[] = [...promoted];

      if (promoted.length < HERO_MAX_ASSETS) {
        const extraNeeded = HERO_MAX_ASSETS - promoted.length;
        const allData = await fetchJson<{ assets: AssetsApiAsset[] }>(
          "/api/assets"
        );
        const all = (allData?.assets ?? []).filter(
          (a) => !promoted.some((p) => p.asset_id === a.asset_id)
        );

        for (let i = all.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }

        combined = [...promoted, ...all.slice(0, extraNeeded)];
      }

      const detailPromises = combined.slice(0, HERO_MAX_ASSETS).map(async (a) => {
        const detail = await fetchJson<{ asset: { screenshots?: string[] } }>(
          `/api/assets/${a.asset_id}`
        );

        return {
          asset_id: a.asset_id,
          title: a.title,
          description: a.description,
          preview_url: a.preview_url,
          download_count: a.download_count,
          isPromoted: a.isPromoted,
          screenshots: detail?.asset?.screenshots ?? [],
        } as HeroAsset;
      });

      const heroAssets = await Promise.all(detailPromises);

      if (isMounted) {
        setAssets(heroAssets);
        setActiveIndex(0);
        setIsLoading(false);
      }
    };

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-rotate hero and reset timer whenever the active slide changes
  useEffect(() => {
    if (!assets.length) return undefined;

    const start = Date.now();
    setRotationStart(start);

    const timeout = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % assets.length);
    }, HERO_ROTATION_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [assets, activeIndex]);

  // Progress bar for time until next auto-rotation
  useEffect(() => {
    if (!rotationStart) {
      setRotationProgress(0);
      return undefined;
    }

    const updateProgress = () => {
      const elapsed = Date.now() - rotationStart;
      const ratio = Math.min(
        Math.max(elapsed / HERO_ROTATION_INTERVAL_MS, 0),
        1
      );
      setRotationProgress(ratio);
    };

    updateProgress();

    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, [rotationStart]);

  const activeAsset = useMemo(
    () => (assets.length ? assets[Math.min(activeIndex, assets.length - 1)] : null),
    [assets, activeIndex]
  );

  const secondaryAssets = useMemo(() => {
    if (!assets.length) return [];
    const others: HeroAsset[] = [];
    for (let offset = 1; offset < Math.min(assets.length, HERO_MAX_ASSETS); offset += 1) {
      const idx = (activeIndex + offset) % assets.length;
      if (idx === activeIndex) continue;
      others.push(assets[idx]);
    }
    return others.slice(0, HERO_MAX_ASSETS - 1);
  }, [assets, activeIndex]);

  const handleAssetSelect = (assetId: string) => {
    const index = assets.findIndex((asset) => asset.asset_id === assetId);
    if (index !== -1) {
      setActiveIndex(index);
    }
  };

  if (isLoading) {
    return (
      <section className="home-hero home-hero-loading">
        <div className="home-hero-background home-hero-background-skeleton" />

        <div className="home-hero-inner">
          <div className="home-hero-left-card skeleton-card">
            <div className="home-hero-thumbnail-wrapper skeleton-media" />

            <div className="home-hero-text">
              <div className="skeleton-line skeleton-line-lg" />
              <div className="skeleton-line skeleton-line-md" />
              <div className="skeleton-line skeleton-line-sm" />

              <div className="home-hero-meta">
                <span className="home-hero-meta-pill skeleton-pill" />
                <span className="home-hero-meta-pill skeleton-pill" />
              </div>
            </div>
          </div>

          <div className="home-hero-right-column">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="home-hero-screenshot-card skeleton-card"
              >
                <div className="home-hero-screenshot-image-wrapper skeleton-media">
                  <div className="home-hero-screenshot-text">
                    <div className="skeleton-line skeleton-line-md" />
                    <div className="skeleton-line skeleton-line-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!activeAsset) {
    return null;
  }

  const backgroundUrl = getPrimaryScreenshot(activeAsset);
  const thumbnailUrl = getFallbackPreview(activeAsset);

  return (
    <section className="home-hero">
      <div className="home-hero-top-gradient" />
      <div
        className="home-hero-background"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />

      <div className="home-hero-inner">
        <div className="home-hero-left-card">
          <div className="home-hero-thumbnail-wrapper">
            <Image
              src={thumbnailUrl}
              alt={activeAsset.title}
              fill
              sizes="(max-width: 768px) 40vw, 260px"
              className="home-hero-thumbnail-image"
              onError={(e) => {
                e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
              }}
            />
          </div>

          <div className="home-hero-text">
            <h1 className="home-hero-title">{activeAsset.title}</h1>
            <p className="home-hero-description">
              {truncateDescription(activeAsset.description)}
            </p>

            <div className="home-hero-cta">
              <Link
                href={`/assets/${activeAsset.asset_id}`}
                className="home-hero-cta-link"
                aria-label={`View modpack ${activeAsset.title}`}
              >
                View Modpack
              </Link>
            </div>
          </div>
        </div>

        <div className="home-hero-right-column">
          {secondaryAssets.map((asset, index) => {
            const screenshotUrl = getPrimaryScreenshot(asset);
            return (
              <button
                key={asset.asset_id}
                type="button"
                className="home-hero-screenshot-card home-hero-screenshot-card-button"
                onClick={() => handleAssetSelect(asset.asset_id)}
                aria-label={`Show ${asset.title} in hero`}
              >
                <div className="home-hero-screenshot-image-wrapper">
                  <Image
                    src={screenshotUrl}
                    alt={asset.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 320px"
                    className="home-hero-screenshot-image"
                    onError={(e) => {
                      e.currentTarget.src = "/asset-thumbnails/essentials.jpg";
                    }}
                  />

                  <div className="home-hero-screenshot-text">
                    <h3 className="home-hero-screenshot-title">{asset.title}</h3>
                    <p className="home-hero-screenshot-description">
                      {truncateDescription(asset.description, 110)}
                    </p>
                    {index === 0 && (
                      <div className="home-hero-progress" aria-hidden="true">
                        <div className="home-hero-progress-track">
                          <div
                            className="home-hero-progress-fill"
                            style={{
                              width: `${Math.round(rotationProgress * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {assets.length > 1 && (
        <div className="home-hero-indicators">
          {assets.map((asset, index) => (
            <button
              key={asset.asset_id}
              type="button"
              className={`home-hero-indicator ${
                index === activeIndex ? "home-hero-indicator-active" : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}



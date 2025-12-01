/* Client-side hook to fetch a randomized set of top-downloaded assets
 * for the Netflix-style discovery rows on the homepage.
 */

"use client";

import { useEffect, useMemo, useState } from "react";

export interface DiscoveryAsset {
  asset_id: string;
  title: string;
  description: string;
  preview_url: string | null;
  download_count: number;
  category?: {
    category_id: string;
    name: string;
  } | null;
}

interface AssetsApiResponse {
  assets: DiscoveryAsset[];
}

interface UseTopAssetsOptions {
  /**
   * Maximum number of items to return after randomization.
   * This should usually be 10 for the “Top 10” rows.
   */
  limit?: number;
  /**
   * How many top-downloaded assets to pull from the API before shuffling.
   * We request a larger slice than we need so the Top 10 can be randomized
   * while still feeling like it comes from “the most popular” group.
   */
  fetchLimit?: number;
}

export function useTopAssets(options: UseTopAssetsOptions = {}) {
  const { limit = 10, fetchLimit = 32 } = options;

  const [rawAssets, setRawAssets] = useState<DiscoveryAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/assets?sort=downloads&order=desc&limit=${fetchLimit}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error(`Failed to load assets (status ${res.status})`);
        }

        const data = (await res.json()) as AssetsApiResponse;
        if (!isMounted) return;

        setRawAssets(data.assets ?? []);
      } catch (err: any) {
        if (!isMounted) return;
        // Fail silently but record error so the UI can show a graceful fallback.
        setError(err?.message || "Failed to load assets");
        setRawAssets([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [fetchLimit]);

  const randomizedTopAssets = useMemo(() => {
    if (!rawAssets.length) return [];

    // Shallow copy, then Fisher–Yates shuffle so each visit gets a
    // different ordering while still coming from the highest-download pool.
    const working = [...rawAssets];
    for (let i = working.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [working[i], working[j]] = [working[j], working[i]];
    }

    return working.slice(0, limit);
  }, [rawAssets, limit]);

  return {
    assets: randomizedTopAssets,
    isLoading,
    error,
  };
}



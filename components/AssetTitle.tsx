"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

interface AssetTitleProps {
  title: string;
  logoUrl?: string | null;
  className?: string;
  /**
   * If true, render the text title but visually hide it while keeping it for assistive tech.
   * Useful when the logo visually replaces the title.
   */
  visuallyHideText?: boolean;
  imageProps?: Omit<ComponentProps<typeof Image>, "src" | "alt">;
}

export default function AssetTitle({
  title,
  logoUrl,
  className,
  visuallyHideText = false,
  imageProps,
}: AssetTitleProps) {
  const showLogo = !!logoUrl;

  return (
    <span className={["asset-title-logo", className].filter(Boolean).join(" ")}>
      {showLogo ? (
        <>
          <span className="asset-title-logo-image-wrapper">
            <Image
              src={logoUrl as string}
              alt={title}
              width={320}
              height={80}
              {...imageProps}
            />
          </span>
          {/* Keep text for accessibility / fallback layout if needed */}
          <span className={visuallyHideText ? "asset-title-visually-hidden" : "asset-title-text"}>
            {title}
          </span>
        </>
      ) : (
        <span className="asset-title-text">{title}</span>
      )}
    </span>
  );
}



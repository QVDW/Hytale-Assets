"use client";

import { logos, type Logo } from "../src/config/logos";
import Image from "next/image";
import "../src/styles/logoCarousel.scss";

export default function LogoCarousel() {
  const duplicatedLogos = [...logos, ...logos, ...logos];

  const renderLogo = (logo: Logo, index: number) => {
    const logoContent = (
      <div className="logo-item">
        <Image
          src={logo.path}
          alt={logo.name}
          width={150}
          height={80}
          className="logo-image"
          style={{
            objectFit: "contain",
            width: "auto",
            height: "auto",
            maxWidth: "150px",
            maxHeight: "80px",
          }}
        />
      </div>
    );

    if (logo.url) {
      return (
        <a
          key={`${logo.name}-${index}`}
          href={logo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="logo-link"
        >
          {logoContent}
        </a>
      );
    }

    return <div key={`${logo.name}-${index}`}>{logoContent}</div>;
  };

  return (
    <section className="logo-carousel-section">
      <div className="logo-carousel-container">
        <div className="logo-carousel-track">
          <div className="logo-carousel-inner">
            {duplicatedLogos.map((logo, index) => (
              <div key={`${logo.name}-${index}`} className="logo-slide">
                {renderLogo(logo, index)}
              </div>
            ))}
          </div>
          <div className="logo-carousel-inner" aria-hidden="true">
            {duplicatedLogos.map((logo, index) => (
              <div key={`${logo.name}-duplicate-${index}`} className="logo-slide">
                {renderLogo(logo, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


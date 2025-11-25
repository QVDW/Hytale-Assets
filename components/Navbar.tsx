'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clientConfig from '../client.config.js';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  isScrolled?: boolean;
  setIsScrolled?: (isScrolled: boolean) => void;
  scrolledBackgroundColor?: string;
  isLightPage?: boolean;
}

export default function Navbar({ isMenuOpen, setIsMenuOpen, isScrolled: externalIsScrolled, setIsScrolled: externalSetIsScrolled, scrolledBackgroundColor, isLightPage = false }: NavbarProps) {
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();
  
  // Use external state if provided, otherwise use internal state
  const isScrolled = externalIsScrolled !== undefined ? externalIsScrolled : internalIsScrolled;
  const setIsScrolled = externalSetIsScrolled || setInternalIsScrolled;
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Trigger header animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100); // Small delay to ensure smooth animation

    return () => clearTimeout(timer);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 1);
    };

    // Check initial scroll position immediately
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsScrolled]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest(".nav-slide-menu") && !target.closest(".nav-menu-btn")) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen, setIsMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMenuOpen]);

  return (
    <header 
      className={`${isScrolled || isMenuOpen ? "scrolled" : ""} ${isLightPage ? "light-page" : ""} ${isLoaded ? "loaded" : ""}`}
      style={scrolledBackgroundColor && (isScrolled || isMenuOpen) ? { backgroundColor: scrolledBackgroundColor } : {}}
    >
      <nav>
        <div className={`nav-logo ${isLoaded ? 'animate-in' : ''}`}>
          <Link href="/">
            <Image 
              src={clientConfig.branding.logo.src}
              alt={clientConfig.branding.logo.alt}
              width={clientConfig.branding.logo.width}
              height={clientConfig.branding.logo.height}
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation - visible on >1200px */}
        <div className="nav-desktop-menu">
          <Link href="/" className={`${pathname === '/' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="1">HOME</Link>
          <Link href="/diensten" className={`${pathname === '/diensten' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="2">DIENSTEN</Link>
          <Link href="/over-ons" className={`${pathname === '/over-ons' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="3">OVER ONS</Link>
          <Link href="/contact" className={`${pathname === '/contact' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="4">CONTACT</Link>
        </div>

        {/* Mobile Menu Button - visible on <1200px */}
        <div className="nav-menu">
          <button className={`nav-menu-btn ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      
        {/* Slide-out menu */}
        <div 
          className={`nav-slide-menu ${isMenuOpen ? "open" : ""}`}
          style={scrolledBackgroundColor ? { backgroundColor: scrolledBackgroundColor } : {}}
        >
          <div className="menu-content">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>HOME</Link>
            <Link href="/diensten" className={pathname === '/diensten' ? 'active' : ''}>DIENSTEN</Link>
            <Link href="/over-ons" className={pathname === '/over-ons' ? 'active' : ''}>OVER ONS</Link>
            <Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>CONTACT</Link>
            <Link href="/contact" className="menu-quote-button">OFFERTE AANVRAAGEN</Link>
          </div>
        </div>
        <div className={`nav-quote-btn ${isLoaded ? 'animate-in' : ''}`}>
          <Link href="/contact">OFFERTE AANVRAAGEN</Link>
        </div>
      </nav>
    </header>
  );
}
'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { IoMdPerson } from "react-icons/io";
import clientConfig from '../client.config.js';
import { GoPlusCircle } from "react-icons/go";

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  isScrolled?: boolean;
  setIsScrolled?: (isScrolled: boolean) => void;
  scrolledBackgroundColor?: string;
  isLightPage?: boolean;
}

interface UserData {
  user_id: string;
  username: string;
  profile_picture: string;
}

export default function Navbar({ isMenuOpen, setIsMenuOpen, isScrolled: externalIsScrolled, setIsScrolled: externalSetIsScrolled, scrolledBackgroundColor, isLightPage = false }: NavbarProps) {
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
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
      if (isUserDropdownOpen && !target.closest(".user-account-dropdown") && !target.closest(".user-account-icon")) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isMenuOpen || isUserDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen, setIsMenuOpen, isUserDropdownOpen]);

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

  // Check user authentication status
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const checkAuth = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("userToken");
      
      if (!token) {
        if (isMounted) {
          setIsLoggedIn(false);
          setUserData(null);
        }
        return;
      }

      try {
        const response = await fetch("/api/user-auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          },
          signal: abortController.signal
        });

        if (!isMounted) return;

        if (response.ok) {
          const user = await response.json();
          if (isMounted) {
            setIsLoggedIn(true);
            setUserData(user);
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("userToken");
          if (isMounted) {
            setIsLoggedIn(false);
            setUserData(null);
          }
        }
      } catch (error) {
        // Ignore abort errors (component unmounted)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error("Error checking auth:", error);
        if (isMounted) {
          setIsLoggedIn(false);
          setUserData(null);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [pathname]); // Re-check when route changes

  const isHomePage = pathname === "/";

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userToken");
      setIsLoggedIn(false);
      setUserData(null);
      setIsUserDropdownOpen(false);
      setIsMenuOpen(false);
      router.push("/login");
    }
  };

  return (
    <header 
      className={`${isScrolled || isMenuOpen ? "scrolled" : ""} ${isLightPage ? "light-page" : ""} ${isLoaded ? "loaded" : ""} ${isHomePage ? "home-header" : ""}`}
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
          <Link href="/assets" className={`${pathname === '/assets' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="1">ASSETS</Link>
          <Link href="/servers" className={`${pathname === '/servers' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="2">SERVER LIST</Link>
          <Link href="/save-files" className={`${pathname === '/save-files' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="3">SKINS</Link>
          <Link href="/json-files" className={`${pathname === '/json-files' ? 'active' : ''} ${isLoaded ? 'animate-in' : ''}`} data-animation-delay="4">SAVE FILES</Link>
        </div>

        {/* Search Bar */}
        <div className="nav-search-bar">
          <div className="search-input-wrapper">
            <CiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <Link href="/upload" className="upload-icon">
          <GoPlusCircle className="upload-icon-svg" />
        </Link>

        {/* User Account Icon with Dropdown */}
        <div className="user-account-wrapper">
          <button 
            className="user-account-icon"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            aria-label="User account menu"
          >
            {isLoggedIn && userData?.profile_picture ? (
              <Image
                src={userData.profile_picture}
                alt={userData.username}
                width={32}
                height={32}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <IoMdPerson />
            )}
          </button>
          {isUserDropdownOpen && (
            <div className="user-account-dropdown" ref={userDropdownRef}>
              {isLoggedIn ? (
                <>
                  {userData && (
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-username">{userData.username}</span>
                    </div>
                  )}
                  <Link href={`/profile/${userData?.user_id || ''}`} onClick={() => setIsUserDropdownOpen(false)}>Profile</Link>
                  <Link href="/notifications" onClick={() => setIsUserDropdownOpen(false)}>Notifications</Link>
                  <Link href="/assets" onClick={() => setIsUserDropdownOpen(false)}>Assets</Link>
                  <button onClick={handleLogout} className="user-dropdown-logout">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsUserDropdownOpen(false)}>Login</Link>
                  <Link href="/register" onClick={() => setIsUserDropdownOpen(false)}>Register</Link>
                </>
              )}
            </div>
          )}
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
            <Link href="/art-assets" className={pathname === '/art-assets' ? 'active' : ''}>Art Assets</Link>
            <Link href="/plugins" className={pathname === '/plugins' ? 'active' : ''}>Plugins</Link>
            <Link href="/save-files" className={pathname === '/save-files' ? 'active' : ''}>Save Files</Link>
            <Link href="/json-files" className="menu-quote-button">Json Files</Link>
            {isLoggedIn ? (
              <>
                <Link href={`/profile/${userData?.user_id || ''}`} className={pathname?.startsWith('/profile/') ? 'active' : ''}>Profile</Link>
                <button onClick={handleLogout} className="menu-logout-button">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className={pathname === '/login' ? 'active' : ''}>Login</Link>
                <Link href="/register" className={pathname === '/register' ? 'active' : ''}>Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
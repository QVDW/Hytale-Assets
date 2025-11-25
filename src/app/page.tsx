"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import LogoCarousel from "../../components/LogoCarousel";
import "../../src/styles/home.scss";
import Image from "next/image";
import Link from "next/link";
import { CiImageOn } from "react-icons/ci";

function useCountUp(target: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(startValue + (target - startValue) * easeOutQuart);
        
        setCount(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(target);
        }
      };
      
      requestAnimationFrame(animate);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  
  return count;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const count1 = useCountUp(100, 2000, 200);
  const count2 = useCountUp(1000, 2000, 400);
  const count3 = useCountUp(1500, 2000, 600);
  
  // Refs for scroll animations
  const logoCarouselRef = useRef<HTMLDivElement>(null);
  const logoCarouselTitleRef = useRef<HTMLHeadingElement>(null);
  const homeInfoSection1Ref = useRef<HTMLDivElement>(null);
  const homeInfoSection2Ref = useRef<HTMLDivElement>(null);
  const homeInfoSmallTitleRef = useRef<HTMLDivElement>(null);
  const homeInfoSmallItemsRef = useRef<HTMLDivElement>(null);
  const homeProjectsTitleRef = useRef<HTMLHeadingElement>(null);
  const homeProjectsItemsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Special observer for footer with different rootMargin
    const footerObserverOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px 0px 0px',
    };
    
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          footerObserver.unobserve(entry.target);
        }
      });
    }, footerObserverOptions);
    
    // Observe all elements that need animation
    const elementsToObserve = [
      logoCarouselRef.current,
      logoCarouselTitleRef.current,
      homeInfoSection1Ref.current,
      homeInfoSection2Ref.current,
      homeInfoSmallTitleRef.current,
      homeInfoSmallItemsRef.current,
      homeProjectsTitleRef.current,
      homeProjectsItemsRef.current,
    ].filter(Boolean) as Element[];
    
    elementsToObserve.forEach((el) => observer.observe(el));
    
    // Function to setup footer observer
    const setupFooterObserver = () => {
      if (footerRef.current) {
        footerObserver.observe(footerRef.current);
        
        // Also check if footer is already visible (for short pages)
        const checkFooterVisibility = () => {
          if (footerRef.current) {
            const rect = footerRef.current.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            if (isVisible && !footerRef.current.classList.contains('animate-in')) {
              footerRef.current.classList.add('animate-in');
            }
          }
        };
        
        // Check immediately and after delays to handle async loading
        checkFooterVisibility();
        setTimeout(checkFooterVisibility, 100);
        setTimeout(checkFooterVisibility, 500);
        setTimeout(checkFooterVisibility, 1000);
      }
    };
    
    // Setup footer observer immediately and with delays to handle async loading
    setupFooterObserver();
    setTimeout(setupFooterObserver, 100);
    setTimeout(setupFooterObserver, 500);
    
    // Capture footerRef.current for cleanup
    const footerElement = footerRef.current;
    
    return () => {
      elementsToObserve.forEach((el) => observer.unobserve(el));
      if (footerElement) {
        footerObserver.unobserve(footerElement);
      }
    };
  }, []);
  
  const backgroundImage = '/placeholder-background.jpg';
  
  return (
    <div>
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="hero">
        <div className="hero-background" style={{ backgroundImage: `url(${backgroundImage})` }}></div>
        <div className="hero-content">
          <div className="hero-content-text">
            <h1>Lorum Ipsum Dolor Sit Amet</h1>
            <p className="hero-content-text-description-desktop">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.</p>   
            <p className="hero-content-text-description-mobile">Lorem ipsum dolor sit amet</p>
          </div>
          <div className="hero-buttons">
            <button>Lorem Ipsum</button>
            <button>Lorem Ipsum</button>
          </div>
        </div>
        <div className="hero-info-content">
          <div className="hero-info-content-item">
            <h2>{count1}+</h2>
            <p>Lorem ipsum</p>
          </div>
          <div className="hero-info-content-item">
            <h2>{count2}+</h2>
            <p>Lorem ipsum</p>
          </div>
          <div className="hero-info-content-item">
            <h2>{count3}+</h2>
            <p>Lorem ipsum</p>
          </div>
        </div>
      </div>
      <div className="logo-carousel-section">
        <h2 ref={logoCarouselTitleRef} className="scroll-animate">Lorem ipsum</h2>
        <div ref={logoCarouselRef} className="scroll-animate">
          <LogoCarousel />
        </div>
      </div>
      <div className="home-info-section">
        <div ref={homeInfoSection1Ref} className="home-info-section-item scroll-animate">
          <div className="home-info-section-item-image">
            <Image src="/placeholder.svg" alt="Lorem ipsum" width={100} height={100} />
          </div>
          <div className="home-info-section-item-text">
          <div className="home-info-section-item-text-title">
              <h3>Lorem ipsum</h3>
              <h2>Lorem ipsum dolor sit amet</h2>
            </div>
            <p>tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <div className="home-info-section-item-buttons">
              <Link className="home-info-section-item-button home-info-section-item-button-primary" href="/">Lorem ipsum</Link>
              <Link className="home-info-section-item-button home-info-section-item-button-secondary" href="/">Lorem ipsum</Link>
            </div>
          </div>
        </div>
        <div ref={homeInfoSection2Ref} className="home-info-section-item scroll-animate">
          <div className="home-info-section-item-text">
            <div className="home-info-section-item-text-title">
              <h3>Lorem ipsum</h3>
              <h2>Lorem ipsum dolor sit amet</h2>
            </div>
            <p>tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <div className="home-info-section-item-buttons">
              <Link className="home-info-section-item-button home-info-section-item-button-primary" href="/">Lorem ipsum</Link>
              <Link className="home-info-section-item-button home-info-section-item-button-secondary" href="/">Lorem ipsum</Link>
            </div>
          </div>
          <div className="home-info-section-item-image">
            <Image src="/placeholder.svg" alt="Lorem ipsum" width={100} height={100} />
          </div>
        </div>
      </div>
      <div className="home-info-section-small-container">
        <div className="home-info-section-small-title">
          <h2 ref={homeInfoSmallTitleRef} className="scroll-animate">Lorem ipsum</h2>
        </div>
        <div ref={homeInfoSmallItemsRef} className="home-info-section-small scroll-animate">
          <div className="home-info-section-item">
            <CiImageOn />
            <h2>Lorem ipsum</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="home-info-section-item">
            <CiImageOn />
            <h2>Lorem ipsum</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="home-info-section-item">
            <CiImageOn />
            <h2>Lorem ipsum</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="home-info-section-item">
            <CiImageOn />
            <h2>Lorem ipsum</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="home-info-section-item">
            <CiImageOn />
            <h2>Lorem ipsum</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="home-info-section-item">
            <CiImageOn />
            <h2>Lorem ipsum</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
        </div>
      </div>
      <div className="home-projects-section">
        <h2 ref={homeProjectsTitleRef} className="scroll-animate">Lorem ipsum</h2>
        <div ref={homeProjectsItemsRef} className="home-projects-section-items scroll-animate">
          <div className="home-projects-section-item">
            <div className="home-projects-section-item-image">
              <Image src="/placeholder.svg" alt="Lorem ipsum" width={100} height={100} />
              <div className="home-projects-section-item-text">
                <h2>Lorem ipsum</h2>
                <p>2025</p>
              </div>
            </div>
          </div>
          <div className="home-projects-section-item">
            <div className="home-projects-section-item-image">
              <Image src="/placeholder.svg" alt="Lorem ipsum" width={100} height={100} />
              <div className="home-projects-section-item-text">
                <h2>Lorem ipsum</h2>
                <p>2025</p>
              </div>
            </div>
          </div>
          <div className="home-projects-section-item">
            <div className="home-projects-section-item-image">
              <Image src="/placeholder.svg" alt="Lorem ipsum" width={100} height={100} />
              <div className="home-projects-section-item-text">
                <h2>Lorem ipsum</h2>
                <p>2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer ref={footerRef} className="scroll-animate" />
    </div>
  );
}
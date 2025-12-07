
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { StoryCard, Rect } from '../types';
import { X, MapPin, Anchor, CircleDashed, Fish, Scale, Box, ArrowRight } from 'lucide-react';

interface Props {
  card: StoryCard;
  initialRect: Rect;
  onClose: () => void;
}

export const ContentOverlay: React.FC<Props> = ({ card, initialRect, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const contentElementsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isCatalog = card.type === 'catalog' && card.productList;

  useEffect(() => {
    const tl = gsap.timeline();

    // 1. Initial State
    gsap.set(containerRef.current, {
      top: initialRect.top,
      left: initialRect.left,
      width: initialRect.width,
      height: initialRect.height,
      borderRadius: '2px',
      position: 'fixed',
      zIndex: 50,
    });

    // 2. Expand Animation
    tl.to(containerRef.current, {
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      borderRadius: '0px',
      duration: 1.0, // Slower expand
      ease: 'power4.inOut',
    })
    // 3. Reveal Content
    .fromTo(contentElementsRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.2 }
    )
    .fromTo(".overlay-animate-up", 
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, stagger: 0.15, ease: "power3.out" },
      "-=0.4"
    );

    // Specific animation for catalog items
    if (isCatalog) {
        gsap.fromTo(".product-card", 
            { x: 150, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.2, stagger: 0.2, ease: "power3.out", delay: 0.4 }
        );
    } else {
        // Standard Image Fade in
        gsap.to(imgContainerRef.current, {
            scale: 1,
            filter: 'grayscale(0%)',
            duration: 1.4,
            ease: 'power2.out',
            delay: 0.3
        });
    }

  }, [initialRect, isCatalog]);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });
    
    tl.to(".overlay-animate-up, .product-card", {
      y: -30,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05
    })
    .to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power3.inOut'
    });
  };

  // Horizontal scroll for catalog via wheel
  const handleWheel = (e: React.WheelEvent) => {
     if(carouselRef.current) {
         carouselRef.current.scrollLeft += e.deltaY;
     }
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-navy-950 overflow-hidden shadow-2xl flex flex-col ${isCatalog ? 'md:flex-col' : 'md:flex-row'}`}
    >
      {/* Close Button */}
      <button 
        onClick={handleClose}
        className="absolute top-8 right-8 z-[60] text-gold-400 hover:text-white transition-colors mix-blend-difference group"
      >
        <div className="relative">
          <CircleDashed size={48} className="animate-[spin_10s_linear_infinite] opacity-50 group-hover:opacity-100" />
          <X size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </button>

      {/* --- STANDARD LAYOUT (Image Left, Text Right) --- */}
      {!isCatalog && (
        <>
            <div ref={imgContainerRef} className="w-full md:w-1/2 h-[40vh] md:h-full relative overflow-hidden grayscale-[50%]">
                <div className="absolute inset-0 bg-navy-900/30 z-10 mix-blend-multiply" />
                <img 
                src={card.image} 
                alt={card.title} 
                className="w-full h-full object-cover scale-110"
                />
                
                {/* Decorative Grid */}
                <div className="absolute inset-0 z-20 p-12 pointer-events-none border-[0.5px] border-white/10 m-4">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10"></div>
                <div className="absolute top-0 left-1/2 h-full w-[1px] bg-white/10"></div>
                </div>

                <div className="absolute bottom-12 left-12 z-20 text-gold-400 font-sans text-xs tracking-widest flex items-center gap-2 overlay-animate-up">
                <MapPin size={14} />
                {card.coordinates}
                </div>
            </div>

            <div ref={textContainerRef} className="w-full md:w-1/2 h-[60vh] md:h-full relative bg-navy-950 flex flex-col justify-center p-8 md:p-24">
                {/* Bg Graphic */}
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <svg width="400" height="400" viewBox="0 0 100 100" className="animate-[spin_60s_linear_infinite]">
                        <path d="M50 0 L100 50 L50 100 L0 50 Z" stroke="currentColor" fill="none" className="text-gold-400" />
                        <circle cx="50" cy="50" r="40" stroke="currentColor" fill="none" className="text-gold-400" />
                    </svg>
                </div>

                <div ref={contentElementsRef} className="relative z-10">
                <div className="flex items-center gap-3 text-gold-500 mb-8 overlay-animate-up">
                    <Anchor size={20} />
                    <span className="text-xs font-sans tracking-[0.3em] uppercase border-b border-gold-500/30 pb-1">
                    {card.type}
                    </span>
                </div>
                
                <h2 className="text-5xl md:text-8xl font-serif text-parchment mb-6 leading-[0.9] overlay-animate-up">
                    {card.title.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                    ))}
                </h2>
                
                <h3 className="text-xl md:text-2xl font-serif text-gold-400 mb-12 italic overlay-animate-up flex items-center gap-4">
                    <span className="w-12 h-[1px] bg-gold-500/50"></span>
                    {card.subtitle}
                </h3>
                
                <div className="overlay-animate-up max-w-lg">
                    <p className="text-parchment/80 font-sans text-lg leading-relaxed first-letter:text-5xl first-letter:font-serif first-letter:text-gold-500 first-letter:mr-3 first-letter:float-left">
                    {card.fullContent}
                    </p>
                </div>

                <div className="mt-16 overlay-animate-up flex gap-6">
                    <button className="group relative px-8 py-4 bg-transparent overflow-hidden border border-gold-500/30 text-gold-400 font-sans text-xs tracking-[0.2em] transition-all hover:border-gold-500">
                    <span className="relative z-10 group-hover:text-navy-950 transition-colors duration-300">REQUEST SHEET</span>
                    <div className="absolute inset-0 bg-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"></div>
                    </button>
                </div>
                </div>
            </div>
        </>
      )}

      {/* --- CATALOG LAYOUT (Full width carousel) --- */}
      {isCatalog && (
          <div ref={contentElementsRef} className="w-full h-full flex flex-col p-8 md:p-12 relative bg-navy-950/95 backdrop-blur-lg">
              {/* Header Area */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 overlay-animate-up shrink-0">
                  <div>
                    <div className="flex items-center gap-3 text-gold-500 mb-4">
                        <Fish size={20} />
                        <span className="text-xs font-sans tracking-[0.3em] uppercase">Premium Inventory</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif text-parchment">The Premium Catch</h2>
                  </div>
                  <p className="text-gold-400/60 font-mono text-xs mt-4 md:mt-0 text-right hidden md:block">
                      SCROLL TO EXPLORE <ArrowRight size={12} className="inline ml-2" /> <br/> 
                      IVP • CO-TREATED • FROZEN AT SEA
                  </p>
              </div>

              {/* Carousel Container */}
              <div 
                ref={carouselRef}
                className="flex-1 overflow-x-auto overflow-y-hidden flex gap-8 pb-8 scrollbar-hide cursor-grab active:cursor-grabbing items-center"
                onWheel={handleWheel}
              >
                  {/* Intro Block inside Carousel */}
                  <div className="min-w-[300px] md:min-w-[400px] flex flex-col justify-center pr-12 product-card shrink-0">
                      <p className="text-2xl text-parchment/80 font-serif italic leading-relaxed">
                        "{card.fullContent}"
                      </p>
                      <div className="mt-8 w-24 h-[1px] bg-gold-500"></div>
                  </div>

                  {/* Product Cards */}
                  {card.productList?.map((product, idx) => (
                      <div key={idx} className="min-w-[320px] md:min-w-[380px] h-[65vh] bg-navy-900/40 border border-white/5 group hover:border-gold-500/50 transition-all duration-500 product-card flex flex-col shrink-0 relative">
                          
                          {/* Product Image */}
                          <div className="h-3/5 overflow-hidden relative">
                              <div className="absolute inset-0 bg-navy-950/20 z-10 group-hover:bg-transparent transition-colors duration-500"></div>
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
                              />
                              <div className="absolute bottom-0 left-0 bg-navy-950/90 backdrop-blur px-4 py-2 text-gold-400 font-mono text-xs z-20 border-t border-r border-gold-500/20">
                                  {String(idx + 1).padStart(2, '0')}
                              </div>
                          </div>

                          {/* Info */}
                          <div className="p-8 flex-1 flex flex-col relative">
                              <h3 className="text-3xl font-serif text-parchment mb-2">{product.name}</h3>
                              <p className="text-sm text-parchment/60 leading-relaxed mb-6 border-b border-white/5 pb-6">
                                  {product.description}
                              </p>

                              {/* Specs */}
                              <div className="mt-auto space-y-3">
                                  {product.specs.map((spec, sIdx) => (
                                      <div key={sIdx} className="flex justify-between items-center text-xs font-sans tracking-wider group/spec">
                                          <span className="text-gold-500/70 uppercase flex items-center gap-2">
                                            {sIdx === 0 && <Fish size={12} className="opacity-50 group-hover/spec:opacity-100"/>}
                                            {sIdx === 1 && <Scale size={12} className="opacity-50 group-hover/spec:opacity-100"/>}
                                            {sIdx === 2 && <Box size={12} className="opacity-50 group-hover/spec:opacity-100"/>}
                                            {spec.label}
                                          </span>
                                          <span className="text-parchment font-medium">{spec.value}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ))}
                  
                  {/* Spacer for end of scroll */}
                  <div className="min-w-[100px] shrink-0"></div>
              </div>
          </div>
      )}
    </div>
  );
};

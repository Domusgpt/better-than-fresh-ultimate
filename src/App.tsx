
import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NauticalCartographyBackground from './components/NauticalCartographyBackground';
import NauticalParticleField from './components/NauticalParticleField';
import OceanCurrents from './components/OceanCurrents';
import { IntroSequence } from './components/IntroSequence';
import { ContentOverlay } from './components/ContentOverlay';
import { STORY_CARDS } from './constants';
import { StoryCard, Rect } from './types';
import { ArrowRight, Compass, ShipWheel, Anchor, ArrowDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Depth Gauge Component
const DepthGauge = () => {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Move indicator based on scroll progress
    gsap.to(indicatorRef.current, {
      y: '80vh', // Move down the screen
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5
      }
    });
  }, []);

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 h-[80vh] w-12 hidden md:flex flex-col items-center z-40 pointer-events-none mix-blend-difference">
      <div className="text-[10px] font-mono text-gold-400 mb-4">SURFACE</div>
      <div className="flex-1 w-[1px] bg-gold-500/20 relative">
        <div ref={indicatorRef} className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-500 rotate-45"></div>
        {/* Hash marks */}
        {Array.from({length: 10}).map((_, i) => (
            <div key={i} className="absolute left-1/2 -translate-x-1/2 w-2 h-[1px] bg-gold-500/30" style={{ top: `${i * 10}%` }}></div>
        ))}
      </div>
      <div className="text-[10px] font-mono text-gold-400 mt-4">DEEP SEA</div>
    </div>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<{ card: StoryCard; rect: Rect } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Section tracking for shader effects
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const mainRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // Sync geometry state with active card
  useEffect(() => {
    setIsExpanded(!!activeCard);
  }, [activeCard]);

  // Animations
  useEffect(() => {
    if (loading) return;

    // 0. Hero Parallax
    if (heroImageRef.current) {
        gsap.to(heroImageRef.current, {
            yPercent: 30,
            ease: "none",
            scrollTrigger: {
                trigger: "header",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // 1. Initial Intro Animation for cards
    gsap.fromTo(cardsRef.current, 
      { 
        y: 150,
        opacity: 0,
        scale: 0.9
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.5,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: mainRef.current,
            start: "top 80%",
        }
      }
    );

    // 2. Per-Card Scroll Interactions (Z-Axis Float)
    cardsRef.current.forEach((card, index) => {
        if(!card) return;

        // Parallax effect for the card relative to scroll
        gsap.fromTo(card,
            { y: 100, scale: 0.95, opacity: 0.5 },
            {
                y: 0,
                scale: 1,
                opacity: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 90%",
                    end: "center center",
                    scrub: 1
                }
            }
        );

        // Exit effect
        gsap.to(card, {
             scale: 0.95,
             opacity: 0.2,
             y: -50,
             ease: "power2.in",
             scrollTrigger: {
                 trigger: card,
                 start: "center top+=100",
                 end: "bottom top",
                 scrub: 1
             }
        });
    });

    // 3. Section-based Shader Triggers
    // Hero section (index 0)
    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom center',
      onEnter: () => setActiveSectionIndex(0),
      onEnterBack: () => setActiveSectionIndex(0)
    });

    // Card sections (index 1-4)
    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      ScrollTrigger.create({
        trigger: card,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setActiveSectionIndex(index + 1),
        onEnterBack: () => setActiveSectionIndex(index + 1)
      });
    });

    // Footer section (index 5)
    ScrollTrigger.create({
      trigger: footerRef.current,
      start: 'top center',
      onEnter: () => setActiveSectionIndex(5),
      onEnterBack: () => setActiveSectionIndex(5)
    });

    // 4. Global Scroll Progress for Shader
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      }
    });

  }, [loading]);

  const handleCardClick = (card: StoryCard, index: number) => {
    const el = cardsRef.current[index];
    if (el) {
      const rect = el.getBoundingClientRect();
      setActiveCard({
        card,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      });
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const inner = e.currentTarget.querySelector('.card-inner');
    if (inner) {
        gsap.to(inner, {
            scale: 1.03,
            boxShadow: "0 30px 60px -15px rgba(212, 175, 55, 0.1)",
            borderColor: "rgba(212, 175, 55, 0.4)",
            duration: 0.6,
            ease: "expo.out"
        });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const inner = e.currentTarget.querySelector('.card-inner');
    if (inner) {
        gsap.to(inner, {
            scale: 1,
            boxShadow: "none",
            borderColor: "rgba(212, 175, 55, 0.1)",
            duration: 0.6,
            ease: "expo.out"
        });
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-parchment selection:bg-gold-500 selection:text-navy-950 perspective-[2000px] overflow-x-hidden" style={{ backgroundColor: '#020c1b' }}>
      
      {/* Layered Nautical Background System - Emergence from Pure Black */}
      <NauticalCartographyBackground
        scrollProgress={scrollProgress}
        sectionIndex={activeSectionIndex}
      />
      <OceanCurrents
        intensity={0.8}
        scrollProgress={scrollProgress}
      />
      <NauticalParticleField
        density={70}
        scrollProgress={scrollProgress}
      />
      <DepthGauge />

      {loading && <IntroSequence onComplete={() => setLoading(false)} />}

      <div 
        ref={mainRef}
        className={`relative z-10 transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Nav */}
        <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-30 mix-blend-difference pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="relative group cursor-pointer">
               <ShipWheel className="text-gold-400 animate-[spin_12s_linear_infinite] group-hover:animate-[spin_3s_linear_infinite]" size={48} strokeWidth={1} />
            </div>
            <div className="leading-none border-l border-gold-500/50 pl-4">
              <span className="block font-serif text-xl font-bold tracking-widest text-parchment">BTF</span>
              <span className="block text-[9px] tracking-[0.4em] text-gold-400 uppercase">Seafood Logic</span>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <header ref={heroRef} className="relative min-h-screen flex flex-col justify-center items-center px-4 pt-20 perspective-[1000px] overflow-hidden">
          <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-navy-950/60 z-10 mix-blend-multiply" />
             <div className="absolute inset-0 bg-gradient-to-b from-navy-950/30 via-transparent to-navy-950 z-10" />
             <img 
                ref={heroImageRef}
                src="https://images.unsplash.com/photo-1468581264429-2548ef9eb732?q=80&w=2070&auto=format&fit=crop" 
                alt="Deep Ocean" 
                className="w-full h-[140%] object-cover opacity-50"
             />
          </div>

          <div className="max-w-6xl text-center space-y-16 transform-style-3d relative z-20">
            <div className="flex justify-center gap-12 text-gold-500/60 font-mono text-xs tracking-[0.2em]">
              <span>LAT 08°58′N</span>
              <span>LON 79°32′W</span>
            </div>

            {/* Your Nautical Logo Above Title */}
            <div className="mb-12 flex justify-center">
              <img 
                src="/images/nautical-logo.jpg" 
                alt="Better Than Fresh Nautical Crest" 
                className="w-32 h-32 md:w-40 md:h-40 opacity-90 filter drop-shadow-2xl rounded-lg"
              />
            </div>

            <h1 className="text-8xl md:text-[11rem] font-serif leading-[0.8] text-parchment mix-blend-overlay opacity-90 drop-shadow-2xl tracking-tight">
              BETTER<br/>
              <span className="text-gold-400/80 italic font-light block mt-4">THAN FRESH</span>
            </h1>
            
            <p className="max-w-xl mx-auto text-parchment/70 leading-relaxed text-xl font-light tracking-wide border-t border-b border-parchment/10 py-8">
              Scientific precision meets wild ocean. Premium frozen Yellowfin, Swordfish, and Mahi from Panama.
            </p>
            
            <div className="animate-bounce pt-10 opacity-50">
                <ArrowDown className="mx-auto text-gold-500" />
            </div>
          </div>
        </header>

        {/* Main Content Feed - Added significant vertical spacing */}
        <main className="max-w-7xl mx-auto px-6 pb-40">
          {STORY_CARDS.map((card, index) => (
            <div 
              key={card.id}
              ref={el => cardsRef.current[index] = el}
              className="group cursor-pointer relative perspective-[1000px] my-[30vh] flex justify-center"
              onClick={() => handleCardClick(card, index)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Card Container */}
              <div className="card-inner relative flex flex-col md:flex-row gap-0 md:gap-0 w-full max-w-5xl items-stretch border border-gold-500/10 rounded-sm bg-navy-900/40 backdrop-blur-md transition-none overflow-hidden">
                
                {/* Technical Sidebar */}
                <div className="w-full md:w-16 flex-shrink-0 border-r border-gold-500/10 bg-navy-950/50 flex flex-row md:flex-col justify-between items-center py-4 px-4 md:px-0 text-gold-500/40 font-mono text-[10px]">
                   <span className="rotate-0 md:-rotate-90 whitespace-nowrap">{card.id}</span>
                   <div className="h-[1px] w-full md:w-[1px] md:h-12 bg-gold-500/20"></div>
                   <Compass size={16} className="animate-spin-slow" />
                </div>

                {/* Image Section */}
                <div className="w-full md:w-1/2 relative h-[400px] md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-gold-500/10">
                   <div className="absolute inset-0 bg-navy-900/20 z-10 group-hover:bg-transparent transition-colors duration-700" />
                   <img 
                     src={card.image} 
                     alt={card.title}
                     className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-[1.5s] ease-out grayscale-[20%] group-hover:grayscale-0"
                   />
                   {/* Tech Overlay on Image */}
                   <div className="absolute top-4 right-4 z-20">
                      <span className="px-2 py-1 bg-navy-950/80 text-[10px] text-gold-400 font-mono border border-gold-500/20">
                        {card.coordinates}
                      </span>
                   </div>
                </div>

                {/* Content Section */}
                <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center relative">
                   {/* Decorative Corners */}
                   <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-gold-500/30"></div>
                   <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-gold-500/30"></div>

                   <div className="mb-6 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${card.type === 'catalog' ? 'bg-gold-400' : 'bg-teal-400'} animate-pulse`}></div>
                      <span className="font-mono text-[10px] tracking-[0.2em] text-gold-500 uppercase opacity-70">{card.type} MODULE</span>
                   </div>
                   
                   <h3 className="text-4xl md:text-5xl font-serif text-parchment group-hover:text-gold-100 transition-colors mb-4">
                     {card.title}
                   </h3>
                   
                   <p className="text-gold-400/80 font-sans text-sm tracking-wider uppercase mb-8 border-l border-gold-500/30 pl-4">
                      {card.subtitle}
                   </p>
                   
                   <p className="text-parchment/70 font-sans leading-relaxed text-lg mb-8">
                     {card.description}
                   </p>

                   <div className="flex items-center gap-4 text-gold-400 text-xs tracking-[0.2em] mt-auto group/btn">
                      <span className="group-hover:underline decoration-gold-500/50 underline-offset-4">EXPAND DATA</span>
                      <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform duration-300" />
                   </div>
                </div>

              </div>
            </div>
          ))}
        </main>

        <footer ref={footerRef} className="text-center py-32 border-t border-parchment/5 relative overflow-hidden bg-navy-950">
           <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           
           {/* Your Logo in Footer */}
           <div className="mb-8 flex justify-center">
             <img 
               src="/images/nautical-logo.jpg" 
               alt="Better Than Fresh Nautical Crest" 
               className="w-20 h-20 opacity-80 filter drop-shadow-lg rounded-md"
             />
           </div>
           
           <Anchor className="mx-auto text-gold-500 mb-8 opacity-60" size={48} strokeWidth={1} />
           <p className="font-serif text-3xl text-parchment mb-6 tracking-wide">Better Than Fresh</p>
           <div className="flex justify-center gap-12 font-mono text-[10px] tracking-[0.2em] text-gold-500/50 uppercase">
              <span>Vertical Integration</span>
              <span>Cold Chain</span>
              <span>Global Distribution</span>
           </div>
        </footer>
      </div>

      {activeCard && (
        <ContentOverlay 
          card={activeCard.card} 
          initialRect={activeCard.rect}
          onClose={() => setActiveCard(null)} 
        />
      )}
    </div>
  );
};

export default App;

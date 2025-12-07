import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  onComplete: () => void;
}

export const IntroSequence: React.FC<Props> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          yPercent: -100,
          duration: 1,
          ease: 'power4.inOut',
          onComplete: onComplete
        });
      }
    });

    tl.set(containerRef.current, { visibility: 'visible' })
      .fromTo(lineRef.current, 
        { width: '0%' }, 
        { width: '100%', duration: 0.8, ease: 'power2.inOut' }
      )
      .fromTo(textRef.current, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 
        '-=0.4'
      )
      .fromTo(subRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.3'
      )
      .to([textRef.current, subRef.current, lineRef.current], {
        opacity: 0,
        y: -20,
        duration: 0.5,
        delay: 0.5
      });

  }, [onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950 text-gold-400 invisible"
    >
      <div className="w-64 relative text-center">
        <h1 ref={textRef} className="text-5xl font-serif tracking-tighter mb-2">
          BETTER THAN FRESH
        </h1>
        <div ref={lineRef} className="h-[2px] bg-gold-500 mx-auto" />
        <p ref={subRef} className="mt-4 text-xs font-sans tracking-[0.3em] text-parchment">
          CHAOS • STRUCTURE • QUALITY
        </p>
      </div>
    </div>
  );
};
import React, { useEffect, useRef, useCallback } from 'react';

interface GeometricCompassRoseProps {
  scrollProgress: number;
  sectionIndex: number;
  className?: string;
}

interface Layer {
  baseRadius: number;
  points: number;
  strokeWidth: number;
  color: string;
  baseAlpha: number;
  type: 'compass' | 'mandala' | 'spiral' | 'rings' | 'sacred';
  parallaxDepth: number; // 0-1, deeper layers move less
  scrollSensitivity: number; // How much this layer responds to scroll
}

const GeometricCompassRose: React.FC<GeometricCompassRoseProps> = ({
  scrollProgress,
  sectionIndex,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const layersRef = useRef<Layer[]>([]);
  const lastScrollProgress = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);
  const staticTime = useRef<number>(0);

  // Color palette based on nautical theme
  const NAUTICAL_PALETTE = {
    gold: '#d4af37',
    darkGold: '#c5a028', 
    seaFoam: '#64ffda',
    silverGrey: '#8892b0',
    deepNavy: '#0a192f',
    oceanBlue: '#112240',
    parchment: '#e6f1ff'
  };

  const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
  const TAU = Math.PI * 2;

  // Initialize compass rose layers for GSAP scroll-driven animation
  const initializeLayers = useCallback(() => {
    layersRef.current = [
      // Outermost compass rose - deepest parallax, least scroll sensitivity
      {
        baseRadius: 200,
        points: 32,
        strokeWidth: 0.8,
        color: NAUTICAL_PALETTE.darkGold,
        baseAlpha: 0.1,
        type: 'compass',
        parallaxDepth: 0.1, // Moves very little
        scrollSensitivity: 0.2 // Low sensitivity to scroll
      },
      
      // Sacred geometry mandala - medium depth
      {
        baseRadius: 150,
        points: 24,
        strokeWidth: 1.0,
        color: NAUTICAL_PALETTE.silverGrey,
        baseAlpha: 0.15,
        type: 'sacred',
        parallaxDepth: 0.3,
        scrollSensitivity: 0.4
      },
      
      // Concentric rings - mid parallax
      {
        baseRadius: 100,
        points: 16,
        strokeWidth: 1.5,
        color: NAUTICAL_PALETTE.gold,
        baseAlpha: 0.2,
        type: 'rings',
        parallaxDepth: 0.5,
        scrollSensitivity: 0.6
      },
      
      // Spiral geometry - responsive to scroll
      {
        baseRadius: 70,
        points: 8,
        strokeWidth: 1.2,
        color: NAUTICAL_PALETTE.seaFoam,
        baseAlpha: 0.25,
        type: 'spiral',
        parallaxDepth: 0.7,
        scrollSensitivity: 0.8
      },
      
      // Central mandala - most reactive
      {
        baseRadius: 40,
        points: 12,
        strokeWidth: 2.0,
        color: NAUTICAL_PALETTE.parchment,
        baseAlpha: 0.3,
        type: 'mandala',
        parallaxDepth: 0.9,
        scrollSensitivity: 1.0 // Full scroll sensitivity
      }
    ];
  }, []);

  // Calculate scroll velocity for motion triggering
  const updateScrollVelocity = useCallback(() => {
    const velocity = Math.abs(scrollProgress - lastScrollProgress.current);
    scrollVelocity.current = scrollVelocity.current * 0.9 + velocity * 0.1; // Smooth velocity
    lastScrollProgress.current = scrollProgress;
    
    // Track static time when not scrolling
    if (velocity < 0.001) {
      staticTime.current += 1;
    } else {
      staticTime.current = 0;
    }
  }, [scrollProgress]);

  // Section-specific transformations
  const getSectionTransform = useCallback((layer: Layer, layerIndex: number) => {
    const sectionIntensity = Math.sin(scrollProgress * TAU) * 0.3 + 0.7; // 0.4 - 1.0
    const scrollIntensity = scrollVelocity.current * 10; // Amplify scroll effect
    
    let radiusMultiplier = 1;
    let alphaMultiplier = 1;
    let rotationOffset = 0;
    
    switch (sectionIndex) {
      case 0: // Hero - minimal activity
        radiusMultiplier = 1 + scrollIntensity * 0.1;
        alphaMultiplier = 0.7 + scrollIntensity * 0.3;
        break;
        
      case 1: // Frozen Standard - expansion
        radiusMultiplier = 1 + scrollIntensity * 0.3 + sectionIntensity * 0.2;
        alphaMultiplier = 0.8 + scrollIntensity * 0.4;
        rotationOffset = scrollProgress * TAU * (layerIndex + 1) * 0.1;
        break;
        
      case 2: // Yellowfin Tuna - spiral focus
        if (layer.type === 'spiral') {
          radiusMultiplier = 1.5 + scrollIntensity * 0.5;
          alphaMultiplier = 1.2 + scrollIntensity * 0.6;
        }
        rotationOffset = scrollProgress * TAU * (layerIndex + 1) * 0.2;
        break;
        
      case 3: // Premium Catch - mandala expansion
        if (layer.type === 'mandala' || layer.type === 'sacred') {
          radiusMultiplier = 1.3 + scrollIntensity * 0.4 + sectionIntensity * 0.3;
          alphaMultiplier = 1.1 + scrollIntensity * 0.5;
        }
        rotationOffset = scrollProgress * TAU * (layerIndex + 1) * 0.15;
        break;
        
      case 4: // Vertical Integration - complex geometry
        radiusMultiplier = 1.2 + scrollIntensity * 0.6 + sectionIntensity * 0.4;
        alphaMultiplier = 1 + scrollIntensity * 0.8;
        rotationOffset = scrollProgress * TAU * (layerIndex + 1) * 0.25;
        break;
        
      default:
        radiusMultiplier = 1 + scrollIntensity * 0.1;
        alphaMultiplier = 0.6 + scrollIntensity * 0.2;
    }
    
    return {
      radius: layer.baseRadius * radiusMultiplier,
      alpha: layer.baseAlpha * alphaMultiplier * (1 - layer.parallaxDepth * 0.3),
      rotation: rotationOffset + (staticTime.current > 100 ? 0 : scrollProgress * TAU * layer.scrollSensitivity)
    };
  }, [sectionIndex, scrollProgress, staticTime]);

  // Draw compass rose pattern
  const drawCompass = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    transform: any
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Main compass points
    const angleStep = TAU / layer.points;
    for (let i = 0; i < layer.points; i++) {
      const angle = i * angleStep;
      const isCardinal = i % (layer.points / 4) === 0;
      const length = isCardinal ? transform.radius : transform.radius * 0.7;
      const weight = isCardinal ? layer.strokeWidth * 1.5 : layer.strokeWidth;
      
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.stroke();
    }
    
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, transform.radius * 0.1, 0, TAU);
    ctx.stroke();
    
    ctx.restore();
  };

  // Draw sacred geometry patterns
  const drawSacred = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    transform: any
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Flower of life pattern
    const petalRadius = transform.radius / 3;
    for (let i = 0; i < 6; i++) {
      const angle = (i * TAU) / 6 + transform.rotation;
      const x = Math.cos(angle) * petalRadius;
      const y = Math.sin(angle) * petalRadius;
      
      ctx.beginPath();
      ctx.arc(x, y, petalRadius, 0, TAU);
      ctx.stroke();
    }
    
    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, petalRadius, 0, TAU);
    ctx.stroke();
    
    ctx.restore();
  };

  // Draw concentric rings
  const drawRings = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    transform: any
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Multiple concentric circles
    const rings = 5;
    for (let i = 1; i <= rings; i++) {
      const radius = (transform.radius * i) / rings;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.stroke();
      
      // Add tick marks
      if (i === rings) {
        const ticks = layer.points;
        for (let j = 0; j < ticks; j++) {
          const angle = (j * TAU) / ticks;
          const inner = radius * 0.9;
          const outer = radius * 1.1;
          
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }
      }
    }
    
    ctx.restore();
  };

  // Draw golden ratio spiral
  const drawSpiral = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    transform: any
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Golden ratio spiral
    ctx.beginPath();
    let angle = 0;
    let radius = 1;
    const maxRadius = transform.radius;
    
    ctx.moveTo(radius, 0);
    while (radius < maxRadius) {
      angle += 0.1;
      radius = Math.pow(PHI, angle * 0.1) * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Mirror spiral
    ctx.scale(-1, 1);
    ctx.beginPath();
    angle = 0;
    radius = 1;
    ctx.moveTo(radius, 0);
    while (radius < maxRadius) {
      angle += 0.1;
      radius = Math.pow(PHI, angle * 0.1) * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    ctx.restore();
  };

  // Draw mandala pattern
  const drawMandala = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    transform: any
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Petal mandala
    const petals = layer.points;
    const petalLength = transform.radius * 0.8;
    
    for (let i = 0; i < petals; i++) {
      const angle = (i * TAU) / petals;
      const x = Math.cos(angle) * petalLength;
      const y = Math.sin(angle) * petalLength;
      
      // Draw petal curve
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(x * 0.5, y * 0.5, x, y);
      ctx.quadraticCurveTo(x * 1.2, y * 0.8, x * 0.8, 0);
      ctx.quadraticCurveTo(x * 0.5, -y * 0.3, 0, 0);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    updateScrollVelocity();

    // Render each layer with parallax and scroll responsiveness
    layersRef.current.forEach((layer, index) => {
      const transform = getSectionTransform(layer, index);
      
      // Only render if alpha is significant
      if (transform.alpha < 0.01) return;
      
      switch (layer.type) {
        case 'compass':
          drawCompass(ctx, centerX, centerY, layer, transform);
          break;
        case 'sacred':
          drawSacred(ctx, centerX, centerY, layer, transform);
          break;
        case 'rings':
          drawRings(ctx, centerX, centerY, layer, transform);
          break;
        case 'spiral':
          drawSpiral(ctx, centerX, centerY, layer, transform);
          break;
        case 'mandala':
          drawMandala(ctx, centerX, centerY, layer, transform);
          break;
      }
    });

    animationFrameRef.current = requestAnimationFrame(render);
  }, [updateScrollVelocity, getSectionTransform]);

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    
    initializeLayers();
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeLayers, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none ${className}`}
      style={{ 
        mixBlendMode: 'screen',
        opacity: 0.9,
        zIndex: 1
      }}
    />
  );
};

export default GeometricCompassRose;
import React, { useEffect, useRef, useCallback } from 'react';

interface GeometricCompassRoseProps {
  scrollProgress: number;
  sectionIndex: number;
  className?: string;
}

interface CompassLayer {
  type: 'outerRing' | 'cardinalPoints' | 'intermediatePoints' | 'innerRose' | 'centerStar' | 'ornamentals' | 'decorativeCircles';
  baseRadius: number;
  strokeWidth: number;
  color: string;
  alpha: number;
  rotationSpeed: number; // Different speeds for emergent motion
  parallaxDepth: number; // 0-1 for depth layering
  scrollSensitivity: number;
  points?: number;
  ornamentScale?: number;
}

const GeometricCompassRose: React.FC<GeometricCompassRoseProps> = ({
  scrollProgress,
  sectionIndex,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const layersRef = useRef<CompassLayer[]>([]);
  const timeRef = useRef<number>(0);
  const lastScrollProgress = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);

  // Professional nautical color palette
  const NAUTICAL_PALETTE = {
    deepGold: '#B8860B',      // Darker gold for outer elements
    classicGold: '#d4af37',   // Primary compass gold
    brightGold: '#FFD700',    // Accent highlights
    seaFoam: '#64ffda',       // Mystical sea accent
    silverGrey: '#8892b0',    // Secondary details
    deepNavy: '#0a192f',      // Background elements
    antiqueBrass: '#CD7F32',  // Ornamental details
    ivory: '#FFF8DC'          // Highlight accents
  };

  // Initialize professional compass layers with proper proportions
  const initializeLayers = useCallback(() => {
    layersRef.current = [
      // Layer 7: Outermost decorative ring (deepest parallax)
      {
        type: 'outerRing',
        baseRadius: 280,
        strokeWidth: 1.2,
        color: NAUTICAL_PALETTE.deepGold,
        alpha: 0.15,
        rotationSpeed: 0.002,
        parallaxDepth: 0.1,
        scrollSensitivity: 0.1,
        ornamentScale: 1.0
      },
      
      // Layer 6: Ornamental decorations around outer ring
      {
        type: 'ornamentals',
        baseRadius: 260,
        strokeWidth: 0.8,
        color: NAUTICAL_PALETTE.antiqueBrass,
        alpha: 0.2,
        rotationSpeed: -0.003,
        parallaxDepth: 0.2,
        scrollSensitivity: 0.15,
        points: 16,
        ornamentScale: 0.8
      },

      // Layer 5: Cardinal points (N, S, E, W) - most prominent
      {
        type: 'cardinalPoints',
        baseRadius: 220,
        strokeWidth: 2.5,
        color: NAUTICAL_PALETTE.classicGold,
        alpha: 0.4,
        rotationSpeed: 0.001,
        parallaxDepth: 0.3,
        scrollSensitivity: 0.2,
        points: 4
      },

      // Layer 4: Intermediate points (NE, NW, SE, SW)
      {
        type: 'intermediatePoints',
        baseRadius: 200,
        strokeWidth: 1.8,
        color: NAUTICAL_PALETTE.silverGrey,
        alpha: 0.35,
        rotationSpeed: -0.004,
        parallaxDepth: 0.4,
        scrollSensitivity: 0.3,
        points: 8
      },

      // Layer 3: Decorative circles at intermediate radii
      {
        type: 'decorativeCircles',
        baseRadius: 160,
        strokeWidth: 1.0,
        color: NAUTICAL_PALETTE.seaFoam,
        alpha: 0.25,
        rotationSpeed: 0.006,
        parallaxDepth: 0.5,
        scrollSensitivity: 0.4,
        points: 16
      },

      // Layer 2: Inner compass rose (detailed)
      {
        type: 'innerRose',
        baseRadius: 120,
        strokeWidth: 1.5,
        color: NAUTICAL_PALETTE.brightGold,
        alpha: 0.45,
        rotationSpeed: -0.008,
        parallaxDepth: 0.7,
        scrollSensitivity: 0.6,
        points: 32
      },

      // Layer 1: Central star (most responsive)
      {
        type: 'centerStar',
        baseRadius: 60,
        strokeWidth: 2.0,
        color: NAUTICAL_PALETTE.ivory,
        alpha: 0.6,
        rotationSpeed: 0.01,
        parallaxDepth: 0.9,
        scrollSensitivity: 0.8,
        points: 16
      }
    ];
  }, []);

  // Calculate emergent motion with proper timing
  const updateMotion = useCallback(() => {
    timeRef.current += 0.016; // ~60fps increment
    
    // Calculate scroll velocity for reactive motion
    const velocity = Math.abs(scrollProgress - lastScrollProgress.current);
    scrollVelocity.current = scrollVelocity.current * 0.95 + velocity * 0.05;
    lastScrollProgress.current = scrollProgress;
  }, [scrollProgress]);

  // Get section-specific transformations with professional styling
  const getSectionTransform = useCallback((layer: CompassLayer, layerIndex: number) => {
    const baseTime = timeRef.current * layer.rotationSpeed;
    const scrollMotion = scrollProgress * Math.PI * 2 * layer.scrollSensitivity;
    const velocityBoost = scrollVelocity.current * 20; // Amplify for visibility
    
    // Section-specific enhancements
    let radiusMultiplier = 1.0;
    let alphaMultiplier = 1.0;
    let rotationMultiplier = 1.0;
    
    switch (sectionIndex) {
      case 0: // Hero - subtle presence
        alphaMultiplier = 0.7;
        break;
        
      case 1: // Frozen Standard - gentle expansion
        radiusMultiplier = 1.0 + velocityBoost * 0.1;
        alphaMultiplier = 0.8 + velocityBoost * 0.2;
        break;
        
      case 2: // Yellowfin Tuna - inner layers activation
        if (layer.type === 'innerRose' || layer.type === 'centerStar') {
          radiusMultiplier = 1.1 + velocityBoost * 0.15;
          alphaMultiplier = 1.2;
          rotationMultiplier = 1.3;
        }
        break;
        
      case 3: // Premium Catch - ornamental enhancement
        if (layer.type === 'ornamentals' || layer.type === 'decorativeCircles') {
          radiusMultiplier = 1.15 + velocityBoost * 0.2;
          alphaMultiplier = 1.1;
        }
        break;
        
      case 4: // Vertical Integration - full compass activation
        radiusMultiplier = 1.05 + velocityBoost * 0.3;
        alphaMultiplier = 0.9 + velocityBoost * 0.4;
        rotationMultiplier = 1.2;
        break;
        
      default:
        alphaMultiplier = 0.8;
    }
    
    return {
      radius: layer.baseRadius * radiusMultiplier,
      alpha: layer.alpha * alphaMultiplier * (1 - layer.parallaxDepth * 0.2),
      rotation: (baseTime + scrollMotion) * rotationMultiplier,
      scale: 1 + velocityBoost * 0.05
    };
  }, [sectionIndex, scrollProgress, scrollVelocity]);

  // Draw outer decorative ring with proper proportions
  const drawOuterRing = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, transform.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner decorative ring
    ctx.beginPath();
    ctx.arc(0, 0, transform.radius * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    
    // Decorative tick marks around circumference
    const ticks = 72; // Fine detail
    for (let i = 0; i < ticks; i++) {
      const angle = (i / ticks) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const length = isMajor ? 8 : 4;
      const weight = isMajor ? layer.strokeWidth * 1.5 : layer.strokeWidth * 0.8;
      
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * (transform.radius - length),
        Math.sin(angle) * (transform.radius - length)
      );
      ctx.lineTo(
        Math.cos(angle) * transform.radius,
        Math.sin(angle) * transform.radius
      );
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Draw ornamental decorations with floral-inspired details
  const drawOrnamentals = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    const ornaments = layer.points || 16;
    for (let i = 0; i < ornaments; i++) {
      const angle = (i / ornaments) * Math.PI * 2;
      const x = Math.cos(angle) * transform.radius;
      const y = Math.sin(angle) * transform.radius;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      
      // Floral ornament shape
      const size = 12 * (layer.ornamentScale || 1);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size * 0.3, -size * 0.7, size * 0.5, -size * 0.3);
      ctx.quadraticCurveTo(size * 0.3, 0, 0, size * 0.2);
      ctx.quadraticCurveTo(-size * 0.3, 0, -size * 0.5, -size * 0.3);
      ctx.quadraticCurveTo(-size * 0.3, -size * 0.7, 0, -size);
      ctx.stroke();
      
      ctx.restore();
    }
    
    ctx.restore();
  };

  // Draw cardinal points with proper nautical styling
  const drawCardinalPoints = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.fillStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    const cardinals = ['N', 'E', 'S', 'W'];
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * transform.radius;
      const y = Math.sin(angle) * transform.radius;
      
      // Main cardinal ray
      ctx.lineWidth = layer.strokeWidth;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Cardinal point arrow
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      
      const arrowSize = 20;
      ctx.beginPath();
      ctx.moveTo(0, -arrowSize);
      ctx.lineTo(-arrowSize * 0.4, arrowSize * 0.3);
      ctx.lineTo(arrowSize * 0.4, arrowSize * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    }
    
    ctx.restore();
  };

  // Draw intermediate points (half-winds)
  const drawIntermediatePoints = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    const points = layer.points || 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2 + (Math.PI / points); // Offset from cardinals
      const length = i % 2 === 0 ? transform.radius : transform.radius * 0.75;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.stroke();
      
      // Small decorative end
      const endX = Math.cos(angle) * length;
      const endY = Math.sin(angle) * length;
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Draw decorative circles at various radii
  const drawDecorativeCircles = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // Multiple concentric decorative circles
    const circles = 3;
    for (let i = 1; i <= circles; i++) {
      const radius = (transform.radius * i) / circles;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Small decorative dots around circle
      if (i === circles) {
        const dots = layer.points || 16;
        for (let j = 0; j < dots; j++) {
          const angle = (j / dots) * Math.PI * 2;
          const dotX = Math.cos(angle) * radius;
          const dotY = Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    ctx.restore();
  };

  // Draw detailed inner compass rose
  const drawInnerRose = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    const rays = layer.points || 32;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const isMainRay = i % 8 === 0;
      const length = isMainRay ? transform.radius : transform.radius * 0.7;
      const weight = isMainRay ? layer.strokeWidth * 1.3 : layer.strokeWidth * 0.8;
      
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * transform.radius * 0.3, Math.sin(angle) * transform.radius * 0.3);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Draw central star with professional detail
  const drawCenterStar = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, layer: CompassLayer, transform: any) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(transform.rotation);
    ctx.scale(transform.scale, transform.scale);
    
    ctx.strokeStyle = layer.color;
    ctx.fillStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = transform.alpha;
    
    // 16-point star
    const points = layer.points || 16;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? transform.radius : transform.radius * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, transform.radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  // Main render loop with proper layer ordering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);
    updateMotion();

    // Render layers from back to front for proper depth
    layersRef.current.forEach((layer, index) => {
      const transform = getSectionTransform(layer, index);
      
      if (transform.alpha < 0.02) return; // Skip nearly invisible layers
      
      switch (layer.type) {
        case 'outerRing':
          drawOuterRing(ctx, centerX, centerY, layer, transform);
          break;
        case 'ornamentals':
          drawOrnamentals(ctx, centerX, centerY, layer, transform);
          break;
        case 'cardinalPoints':
          drawCardinalPoints(ctx, centerX, centerY, layer, transform);
          break;
        case 'intermediatePoints':
          drawIntermediatePoints(ctx, centerX, centerY, layer, transform);
          break;
        case 'decorativeCircles':
          drawDecorativeCircles(ctx, centerX, centerY, layer, transform);
          break;
        case 'innerRose':
          drawInnerRose(ctx, centerX, centerY, layer, transform);
          break;
        case 'centerStar':
          drawCenterStar(ctx, centerX, centerY, layer, transform);
          break;
      }
    });

    animationFrameRef.current = requestAnimationFrame(render);
  }, [updateMotion, getSectionTransform]);

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
        opacity: 0.8,
        zIndex: 1
      }}
    />
  );
};

export default GeometricCompassRose;
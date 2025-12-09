import React, { useEffect, useRef, useCallback } from 'react';

interface GeometricCompassRoseProps {
  scrollProgress: number;
  sectionIndex: number;
  className?: string;
}

interface Layer {
  radius: number;
  points: number;
  rotationSpeed: number;
  strokeWidth: number;
  color: string;
  alpha: number;
  offset: number;
  type: 'star' | 'circle' | 'polygon' | 'spiral' | 'mandala';
  pulsePhase: number;
}

const GeometricCompassRose: React.FC<GeometricCompassRoseProps> = ({
  scrollProgress,
  sectionIndex,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const layersRef = useRef<Layer[]>([]);
  const timeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastFrameTime = useRef<number>(0);

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

  // Initialize compass rose layers with sacred geometry proportions
  const initializeLayers = useCallback(() => {
    layersRef.current = [
      // Outer cardinal rose - main compass points
      {
        radius: 180,
        points: 32,
        rotationSpeed: 0.001,
        strokeWidth: 1.5,
        color: NAUTICAL_PALETTE.gold,
        alpha: 0.8,
        offset: 0,
        type: 'star',
        pulsePhase: 0
      },
      // Sacred geometry middle layer
      {
        radius: 120,
        points: 16,
        rotationSpeed: -0.0015,
        strokeWidth: 1,
        color: NAUTICAL_PALETTE.seaFoam,
        alpha: 0.6,
        offset: Math.PI / 16,
        type: 'polygon',
        pulsePhase: Math.PI / 3
      },
      // Golden ratio spiral
      {
        radius: 90,
        points: 8,
        rotationSpeed: 0.002,
        strokeWidth: 0.8,
        color: NAUTICAL_PALETTE.darkGold,
        alpha: 0.7,
        offset: Math.PI / 8,
        type: 'spiral',
        pulsePhase: Math.PI / 2
      },
      // Inner mandala
      {
        radius: 60,
        points: 12,
        rotationSpeed: -0.0008,
        strokeWidth: 0.6,
        color: NAUTICAL_PALETTE.silverGrey,
        alpha: 0.5,
        offset: 0,
        type: 'mandala',
        pulsePhase: Math.PI
      },
      // Concentric circles
      {
        radius: 40,
        points: 6,
        rotationSpeed: 0.0012,
        strokeWidth: 2,
        color: NAUTICAL_PALETTE.gold,
        alpha: 0.3,
        offset: Math.PI / 6,
        type: 'circle',
        pulsePhase: Math.PI * 1.5
      }
    ];
  }, []);

  // Draw star/compass rose pattern
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    rotation: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const outerRadius = layer.radius;
    const innerRadius = outerRadius * (layer.points > 16 ? 0.7 : 0.4);
    const angleStep = TAU / layer.points;

    ctx.beginPath();
    for (let i = 0; i <= layer.points; i++) {
      const angle = i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = layer.alpha;
    ctx.stroke();

    // Add cardinal direction markers for main compass
    if (layer.points === 32) {
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        const x1 = Math.cos(angle) * (outerRadius * 0.8);
        const y1 = Math.sin(angle) * (outerRadius * 0.8);
        const x2 = Math.cos(angle) * (outerRadius * 1.1);
        const y2 = Math.sin(angle) * (outerRadius * 1.1);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = layer.strokeWidth * 2;
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Draw polygon pattern
  const drawPolygon = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    rotation: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    const angleStep = TAU / layer.points;

    // Outer polygon
    ctx.beginPath();
    for (let i = 0; i <= layer.points; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * layer.radius;
      const y = Math.sin(angle) * layer.radius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = layer.alpha;
    ctx.stroke();

    // Inner connections for sacred geometry
    ctx.globalAlpha = layer.alpha * 0.3;
    for (let i = 0; i < layer.points; i += 2) {
      const angle1 = i * angleStep;
      const angle2 = ((i + layer.points / 2) % layer.points) * angleStep;
      
      const x1 = Math.cos(angle1) * layer.radius;
      const y1 = Math.sin(angle1) * layer.radius;
      const x2 = Math.cos(angle2) * layer.radius;
      const y2 = Math.sin(angle2) * layer.radius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Draw spiral pattern using golden ratio
  const drawSpiral = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    rotation: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = layer.alpha;

    // Golden ratio spiral
    const spiralTurns = 3;
    const points = layer.points * spiralTurns;
    
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = t * TAU * spiralTurns;
      const radius = layer.radius * Math.pow(PHI, t - 1) * t;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Counter spiral for balance
    ctx.globalAlpha = layer.alpha * 0.5;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = -t * TAU * spiralTurns;
      const radius = layer.radius * Math.pow(PHI, t - 1) * t;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
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
    rotation: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = layer.alpha;

    const angleStep = TAU / layer.points;

    // Petal pattern
    for (let i = 0; i < layer.points; i++) {
      const angle = i * angleStep;
      const petalRadius = layer.radius * 0.6;

      ctx.save();
      ctx.rotate(angle);

      // Petal shape using bezier curves
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        petalRadius * 0.3, -petalRadius * 0.2,
        petalRadius * 0.7, -petalRadius * 0.1,
        petalRadius, 0
      );
      ctx.bezierCurveTo(
        petalRadius * 0.7, petalRadius * 0.1,
        petalRadius * 0.3, petalRadius * 0.2,
        0, 0
      );
      ctx.stroke();

      ctx.restore();
    }

    // Central circle
    ctx.beginPath();
    ctx.arc(0, 0, layer.radius * 0.1, 0, TAU);
    ctx.stroke();

    ctx.restore();
  };

  // Draw concentric circles with connecting lines
  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    layer: Layer,
    rotation: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.strokeWidth;
    ctx.globalAlpha = layer.alpha;

    // Multiple concentric circles
    const circles = 3;
    for (let i = 0; i < circles; i++) {
      const radius = layer.radius * (0.3 + (i * 0.35));
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.globalAlpha = layer.alpha * (0.8 - i * 0.2);
      ctx.stroke();
    }

    // Radial lines
    const angleStep = TAU / layer.points;
    ctx.globalAlpha = layer.alpha * 0.4;
    for (let i = 0; i < layer.points; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * layer.radius;
      const y = Math.sin(angle) * layer.radius;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Mouse interaction handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.x = (event.clientX - rect.left) / rect.width;
    mouseRef.current.y = (event.clientY - rect.top) / rect.height;
  }, []);

  // Section-based transformations
  const getSectionTransform = (sectionIndex: number, baseLayer: Layer) => {
    const transforms = {
      0: { // Hero section
        scale: 1 + Math.sin(timeRef.current * 0.001) * 0.1,
        rotation: baseLayer.offset,
        alpha: baseLayer.alpha,
        radius: baseLayer.radius
      },
      1: { // First card - expand and brighten
        scale: 1.2,
        rotation: baseLayer.offset + scrollProgress * Math.PI * 0.5,
        alpha: Math.min(baseLayer.alpha * 1.5, 1),
        radius: baseLayer.radius * (1 + scrollProgress * 0.3)
      },
      2: { // Second card - geometric morph
        scale: 1 + Math.sin(scrollProgress * Math.PI) * 0.3,
        rotation: baseLayer.offset + scrollProgress * Math.PI,
        alpha: baseLayer.alpha * (0.7 + scrollProgress * 0.3),
        radius: baseLayer.radius * (1 + Math.sin(scrollProgress * Math.PI) * 0.2)
      },
      3: { // Third card - spiral focus
        scale: 0.8 + scrollProgress * 0.4,
        rotation: baseLayer.offset + scrollProgress * Math.PI * 2,
        alpha: baseLayer.alpha,
        radius: baseLayer.radius * (0.8 + scrollProgress * 0.4)
      },
      4: { // Fourth card - mandala expansion
        scale: 1.5 * (1 + Math.sin(scrollProgress * Math.PI) * 0.2),
        rotation: baseLayer.offset - scrollProgress * Math.PI * 0.5,
        alpha: baseLayer.alpha * (0.5 + scrollProgress * 0.5),
        radius: baseLayer.radius * 1.3
      },
      5: { // Footer - fade and contract
        scale: 0.6 + Math.cos(timeRef.current * 0.002) * 0.1,
        rotation: baseLayer.offset + scrollProgress * Math.PI * 3,
        alpha: baseLayer.alpha * 0.3,
        radius: baseLayer.radius * 0.7
      }
    };

    return transforms[sectionIndex as keyof typeof transforms] || transforms[0];
  };

  // Main animation loop
  const animate = useCallback((currentTime: number = 0) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Frame rate limiting
    const deltaTime = currentTime - lastFrameTime.current;
    if (deltaTime < 16) { // ~60fps
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTime.current = currentTime;

    timeRef.current = currentTime;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width * 0.5;
    const centerY = canvas.height * 0.5;

    // Mouse parallax effect
    const mouseInfluence = 0.02;
    const parallaxX = (mouseRef.current.x - 0.5) * mouseInfluence * canvas.width;
    const parallaxY = (mouseRef.current.y - 0.5) * mouseInfluence * canvas.height;

    // Draw each layer with section-based transformations
    layersRef.current.forEach((layer, index) => {
      const transform = getSectionTransform(sectionIndex, layer);
      const baseRotation = timeRef.current * layer.rotationSpeed + layer.offset;
      const pulseScale = 1 + Math.sin(timeRef.current * 0.003 + layer.pulsePhase) * 0.05;
      
      const rotation = baseRotation + transform.rotation;
      const scale = transform.scale * pulseScale;
      const layerAlpha = transform.alpha;

      // Apply parallax based on layer depth
      const layerParallax = (index + 1) / layersRef.current.length;
      const offsetX = centerX + parallaxX * layerParallax;
      const offsetY = centerY + parallaxY * layerParallax;

      // Create modified layer for this frame
      const frameLayer = {
        ...layer,
        alpha: layerAlpha,
        radius: transform.radius
      };

      // Draw layer based on type
      switch (layer.type) {
        case 'star':
          drawStar(ctx, offsetX, offsetY, frameLayer, rotation, scale);
          break;
        case 'polygon':
          drawPolygon(ctx, offsetX, offsetY, frameLayer, rotation, scale);
          break;
        case 'spiral':
          drawSpiral(ctx, offsetX, offsetY, frameLayer, rotation, scale);
          break;
        case 'mandala':
          drawMandala(ctx, offsetX, offsetY, frameLayer, rotation, scale);
          break;
        case 'circle':
          drawCircle(ctx, offsetX, offsetY, frameLayer, rotation, scale);
          break;
      }
    });

    // Draw central compass point
    ctx.save();
    ctx.translate(centerX + parallaxX * 0.5, centerY + parallaxY * 0.5);
    ctx.fillStyle = NAUTICAL_PALETTE.gold;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, TAU);
    ctx.fill();
    
    // Compass needle
    const needleRotation = timeRef.current * 0.0005 + scrollProgress * Math.PI;
    ctx.rotate(needleRotation);
    ctx.strokeStyle = NAUTICAL_PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();
    
    // Needle tip
    ctx.fillStyle = NAUTICAL_PALETTE.seaFoam;
    ctx.beginPath();
    ctx.arc(0, -15, 2, 0, TAU);
    ctx.fill();
    
    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [sectionIndex, scrollProgress]);

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    initializeLayers();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, handleMouseMove, initializeLayers]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none z-[1] ${className}`}
      style={{ 
        mixBlendMode: 'screen', 
        opacity: 0.4,
        filter: 'contrast(1.1) brightness(1.1)'
      }}
    />
  );
};

export default GeometricCompassRose;
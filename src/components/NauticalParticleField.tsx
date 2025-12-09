import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  depth: number; // depth sounding value
  type: 'star' | 'compass' | 'anchor' | 'wave' | 'glow' | 'line';
  layer: number; // 0-2 for depth layering
  rotation: number;
  rotationSpeed: number;
}

interface NauticalParticleFieldProps {
  density?: number;
  scrollProgress?: number;
}

// Nautical cartography color palette
const NAUTICAL_COLORS = [
  '#d4af37', // Antique gold
  '#c5a028', // Darker gold
  '#0a192f', // Deep navy
  '#112240', // Ocean blue
  '#64ffda', // Sea foam accent
  '#8892b0', // Silver grey
  '#e6f1ff', // Parchment
];

const NauticalParticleField: React.FC<NauticalParticleFieldProps> = ({
  density = 120, // Increased for much better effects
  scrollProgress = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const fpsTarget = 60; // Target FPS

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize particles with multiple types and layers
    const initParticles = () => {
      particlesRef.current = [];
      const types = ['star', 'compass', 'anchor', 'wave', 'glow', 'line'] as const;
      
      for (let i = 0; i < density; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const layer = Math.floor(Math.random() * 3); // 0, 1, 2
        
        // Different size ranges for different types
        let size;
        switch (type) {
          case 'compass':
          case 'anchor':
            size = Math.random() * 8 + 4; // 4-12px for larger nautical elements
            break;
          case 'star':
            size = Math.random() * 6 + 2; // 2-8px for stars
            break;
          case 'glow':
            size = Math.random() * 12 + 6; // 6-18px for glowing effects
            break;
          case 'line':
            size = Math.random() * 20 + 10; // 10-30px for depth lines
            break;
          default:
            size = Math.random() * 4 + 1; // 1-5px for waves
        }

        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (0.08 + layer * 0.02), // Much slower, gradual movement
          vy: (Math.random() - 0.5) * (0.08 + layer * 0.02),
          size,
          color: NAUTICAL_COLORS[Math.floor(Math.random() * NAUTICAL_COLORS.length)],
          alpha: Math.random() * 0.6 + 0.1, // Increased alpha range
          life: Math.random() * 100,
          depth: Math.random() * 100, // Fathom reading
          type,
          layer,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.005 // Much slower rotation
        });
      }
    };

    initParticles();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Draw compass rose at position
    const drawCompassRose = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = alpha * 0.3;

      // Cardinal directions
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
        const len = i % 2 === 0 ? size : size * 0.6;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = i % 2 === 0 ? 1.5 : 0.5;
        ctx.stroke();
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    };

    // Draw star particle
    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? size : size * 0.5;
        const sx = Math.cos(angle) * radius;
        const sy = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    // Draw anchor particle
    const drawAnchor = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.1;
      
      // Anchor shape
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.8);
      ctx.lineTo(0, size * 0.8);
      ctx.moveTo(-size * 0.5, size * 0.5);
      ctx.lineTo(0, size * 0.8);
      ctx.lineTo(size * 0.5, size * 0.5);
      ctx.moveTo(-size * 0.3, -size * 0.6);
      ctx.lineTo(size * 0.3, -size * 0.6);
      ctx.stroke();
      ctx.restore();
    };

    // Draw wave particle
    const drawWave = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 0.3;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const waveX = x - size + (i * size * 0.7);
        ctx.moveTo(waveX, y);
        ctx.quadraticCurveTo(waveX + size * 0.2, y - size * 0.5, waveX + size * 0.4, y);
      }
      ctx.stroke();
    };

    // Draw glow particle  
    const drawGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    // Draw depth line particle
    const drawDepthLine = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([size * 0.3, size * 0.2]);
      
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    };

    // Draw depth contour line
    const drawDepthContour = (ctx: CanvasRenderingContext2D, y: number, time: number, alpha: number) => {
      ctx.beginPath();
      ctx.moveTo(0, y);

      for (let x = 0; x < canvas.width; x += 10) {
        const wave = Math.sin(x * 0.01 + time * 0.001) * 5;
        ctx.lineTo(x, y + wave);
      }

      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha * 0.1})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    };

    let time = 0;
    const animate = (currentTime: number = 0) => {
      // Frame rate limiting for better performance
      const deltaTime = currentTime - lastFrameTime.current;
      if (deltaTime < 1000 / fpsTarget) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime.current = currentTime;

      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle depth contour lines (more visible when not scrolled)
      const contourAlpha = 1 - scrollProgress * 0.8;
      for (let i = 0; i < 6; i++) {
        const y = (canvas.height / 6) * i + Math.sin(time * 0.01 + i) * 10;
        drawDepthContour(ctx, y, time, contourAlpha);
      }

      // Draw and update particles
      particlesRef.current.forEach((particle, index) => {
        // Ocean current motion - subtle drift
        const currentX = Math.sin(time * 0.005 + particle.y * 0.01) * 0.2;
        const currentY = Math.cos(time * 0.003 + particle.x * 0.01) * 0.15;

        particle.x += particle.vx + currentX;
        particle.y += particle.vy + currentY;
        particle.life += 0.3;

        // Mouse interaction - particles avoid cursor like fish
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const force = (120 - distance) / 120;
          particle.vx -= (dx / distance) * force * 0.08;
          particle.vy -= (dy / distance) * force * 0.08;
        }

        // Damping
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Update rotation
        particle.rotation += particle.rotationSpeed;
        
        // Enhanced alpha with layer depth
        const layerAlphaMultiplier = 1 - (particle.layer * 0.3); // Upper layers more visible
        particle.alpha = (0.15 + Math.sin(particle.life * 0.015) * 0.3) * layerAlphaMultiplier;

        ctx.globalAlpha = particle.alpha;

        // Draw particle based on type
        switch (particle.type) {
          case 'star':
            drawStar(ctx, particle.x, particle.y, particle.size, particle.color, particle.rotation);
            break;
          case 'compass':
            drawCompassRose(ctx, particle.x, particle.y, particle.size, particle.alpha);
            break;
          case 'anchor':
            drawAnchor(ctx, particle.x, particle.y, particle.size, particle.color, particle.rotation);
            break;
          case 'wave':
            drawWave(ctx, particle.x, particle.y, particle.size, particle.color);
            break;
          case 'glow':
            drawGlow(ctx, particle.x, particle.y, particle.size, particle.color);
            break;
          case 'line':
            drawDepthLine(ctx, particle.x, particle.y, particle.size, particle.color, particle.rotation);
            break;
        }

        // Draw connections - like shipping lanes
        particlesRef.current.forEach((other, otherIndex) => {
          if (index === otherIndex) return;

          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);

            // Gold connections for cartography feel
            const gradient = ctx.createLinearGradient(
              particle.x, particle.y,
              other.x, other.y
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, other.color);

            ctx.strokeStyle = gradient;
            ctx.globalAlpha = (1 - dist / 80) * 0.15;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        });
      });

      // Draw coordinate grid markers (more visible at scroll start)
      if (scrollProgress < 0.5) {
        ctx.globalAlpha = (0.5 - scrollProgress) * 0.3;
        ctx.font = '10px monospace';
        ctx.fillStyle = '#d4af37';

        for (let x = 100; x < canvas.width; x += 200) {
          for (let y = 100; y < canvas.height; y += 200) {
            const lat = (90 - (y / canvas.height) * 180).toFixed(1);
            const lon = ((x / canvas.width) * 360 - 180).toFixed(1);
            ctx.fillText(`${lat}°N ${lon}°W`, x, y);
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [density, scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen', opacity: 0.5 }}
    />
  );
};

export default NauticalParticleField;

import React, { useEffect, useRef, useCallback } from 'react';

interface FishSchoolParticlesProps {
  scrollProgress: number;
  sectionIndex: number;
  compassRotation: number;
  className?: string;
  isHovering?: boolean;
  isClicked?: boolean;
}

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'leader' | 'follower' | 'scout';
  age: number;
  targetX: number;
  targetY: number;
  schoolId: number;
  energy: number;
  color: string;
  alpha: number;
  bodyLength: number;
  tailOffset: number;
  rotationAngle: number;
}

const FishSchoolParticles: React.FC<FishSchoolParticlesProps> = ({
  scrollProgress,
  sectionIndex,
  compassRotation,
  className = "",
  isHovering = false,
  isClicked = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const fishRef = useRef<Fish[]>([]);
  const timeRef = useRef<number>(0);
  const lastCompassRotation = useRef<number>(0);

  // Fish school configuration
  const FISH_CONFIGS = {
    maxFish: 80,
    schoolSize: 15,
    maxSpeed: 0.8, // Much slower for fluid movement
    minSpeed: 0.2,
    separationRadius: 25,
    alignmentRadius: 40,
    cohesionRadius: 60,
    avoidanceForce: 0.05,
    alignmentForce: 0.02,
    cohesionForce: 0.01,
    wanderForce: 0.005,
    compassInfluence: 0.3
  };

  // Nautical fish colors
  const FISH_COLORS = [
    '#64ffda', // Teal
    '#26a69a', // Dark teal
    '#4db6ac', // Medium teal
    '#80cbc4', // Light teal
    '#b2dfdb', // Very light teal
    '#e0f2f1', // Pale teal
    '#d4af37', // Gold
    '#c5a028'  // Dark gold
  ];

  // Initialize fish school with realistic behaviors
  const initializeFishSchool = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fish: Fish[] = [];
    const numSchools = 4;
    
    for (let school = 0; school < numSchools; school++) {
      const schoolCenterX = Math.random() * canvas.width;
      const schoolCenterY = Math.random() * canvas.height;
      const fishPerSchool = Math.floor(FISH_CONFIGS.maxFish / numSchools);
      
      for (let i = 0; i < fishPerSchool; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100;
        
        fish.push({
          x: schoolCenterX + Math.cos(angle) * distance,
          y: schoolCenterY + Math.sin(angle) * distance,
          vx: (Math.random() - 0.5) * FISH_CONFIGS.maxSpeed,
          vy: (Math.random() - 0.5) * FISH_CONFIGS.maxSpeed,
          size: 2 + Math.random() * 4,
          type: i === 0 ? 'leader' : (i < 3 ? 'scout' : 'follower'),
          age: Math.random() * 1000,
          targetX: schoolCenterX,
          targetY: schoolCenterY,
          schoolId: school,
          energy: 0.5 + Math.random() * 0.5,
          color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
          alpha: 0.6 + Math.random() * 0.4,
          bodyLength: 8 + Math.random() * 12,
          tailOffset: 0,
          rotationAngle: angle
        });
      }
    }
    
    fishRef.current = fish;
  }, []);

  // Flocking algorithm with fish-specific behaviors
  const updateFishMovement = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || fishRef.current.length === 0) return;

    const fish = fishRef.current;
    const compassDelta = compassRotation - lastCompassRotation.current;
    const isCompassTurning = Math.abs(compassDelta) > 0.001;
    
    fish.forEach((currentFish, index) => {
      let separationX = 0, separationY = 0, separationCount = 0;
      let alignmentX = 0, alignmentY = 0, alignmentCount = 0;
      let cohesionX = 0, cohesionY = 0, cohesionCount = 0;

      // Check neighboring fish for flocking behavior
      fish.forEach((otherFish, otherIndex) => {
        if (index === otherIndex) return;
        
        const dx = currentFish.x - otherFish.x;
        const dy = currentFish.y - otherFish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Same school preference
        const schoolMultiplier = currentFish.schoolId === otherFish.schoolId ? 1.5 : 0.3;
        
        // Separation - avoid crowding
        if (distance < FISH_CONFIGS.separationRadius && distance > 0) {
          separationX += (dx / distance) * schoolMultiplier;
          separationY += (dy / distance) * schoolMultiplier;
          separationCount++;
        }
        
        // Alignment - match velocity
        if (distance < FISH_CONFIGS.alignmentRadius) {
          alignmentX += otherFish.vx * schoolMultiplier;
          alignmentY += otherFish.vy * schoolMultiplier;
          alignmentCount++;
        }
        
        // Cohesion - move toward center of neighbors
        if (distance < FISH_CONFIGS.cohesionRadius) {
          cohesionX += otherFish.x * schoolMultiplier;
          cohesionY += otherFish.y * schoolMultiplier;
          cohesionCount++;
        }
      });

      // Apply flocking forces
      if (separationCount > 0) {
        currentFish.vx += (separationX / separationCount) * FISH_CONFIGS.avoidanceForce;
        currentFish.vy += (separationY / separationCount) * FISH_CONFIGS.avoidanceForce;
      }
      
      if (alignmentCount > 0) {
        currentFish.vx += (alignmentX / alignmentCount - currentFish.vx) * FISH_CONFIGS.alignmentForce;
        currentFish.vy += (alignmentY / alignmentCount - currentFish.vy) * FISH_CONFIGS.alignmentForce;
      }
      
      if (cohesionCount > 0) {
        const avgX = cohesionX / cohesionCount;
        const avgY = cohesionY / cohesionCount;
        currentFish.vx += (avgX - currentFish.x) * FISH_CONFIGS.cohesionForce;
        currentFish.vy += (avgY - currentFish.y) * FISH_CONFIGS.cohesionForce;
      }

      // Compass rotation influence - fish scatter or regroup
      if (isCompassTurning) {
        const scatterForce = compassDelta * FISH_CONFIGS.compassInfluence;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Fish scatter away from center when compass spins fast
        if (Math.abs(compassDelta) > 0.01) {
          const awayX = currentFish.x - centerX;
          const awayY = currentFish.y - centerY;
          const distance = Math.sqrt(awayX * awayX + awayY * awayY);
          if (distance > 0) {
            currentFish.vx += (awayX / distance) * scatterForce * 2;
            currentFish.vy += (awayY / distance) * scatterForce * 2;
          }
        } else {
          // Gentle spiral movement with slow compass rotation
          const spiral = scatterForce * 10;
          currentFish.vx += Math.cos(timeRef.current * 0.01 + index) * spiral;
          currentFish.vy += Math.sin(timeRef.current * 0.01 + index) * spiral;
        }
      }

      // Leader behavior - explore and guide
      if (currentFish.type === 'leader') {
        const wanderAngle = timeRef.current * 0.005 + index;
        currentFish.vx += Math.cos(wanderAngle) * FISH_CONFIGS.wanderForce * 2;
        currentFish.vy += Math.sin(wanderAngle) * FISH_CONFIGS.wanderForce * 2;
      }

      // Scout behavior - patrol edges
      if (currentFish.type === 'scout') {
        const edgeAttraction = 0.001;
        const distanceToEdge = Math.min(
          currentFish.x,
          currentFish.y,
          canvas.width - currentFish.x,
          canvas.height - currentFish.y
        );
        if (distanceToEdge > 100) {
          currentFish.vx += (canvas.width / 2 - currentFish.x) * edgeAttraction;
          currentFish.vy += (canvas.height / 2 - currentFish.y) * edgeAttraction;
        }
      }

      // Limit speed for fluid movement
      const speed = Math.sqrt(currentFish.vx * currentFish.vx + currentFish.vy * currentFish.vy);
      const maxSpeed = FISH_CONFIGS.maxSpeed * currentFish.energy;
      if (speed > maxSpeed) {
        currentFish.vx = (currentFish.vx / speed) * maxSpeed;
        currentFish.vy = (currentFish.vy / speed) * maxSpeed;
      }
      
      // Ensure minimum speed for liveliness
      if (speed < FISH_CONFIGS.minSpeed) {
        const angle = Math.atan2(currentFish.vy, currentFish.vx);
        currentFish.vx = Math.cos(angle) * FISH_CONFIGS.minSpeed;
        currentFish.vy = Math.sin(angle) * FISH_CONFIGS.minSpeed;
      }

      // Update position
      currentFish.x += currentFish.vx;
      currentFish.y += currentFish.vy;
      
      // Update rotation angle for realistic fish orientation
      currentFish.rotationAngle = Math.atan2(currentFish.vy, currentFish.vx);
      
      // Update tail animation
      currentFish.tailOffset += speed * 0.3;
      
      // Wrap around screen edges
      if (currentFish.x < 0) currentFish.x = canvas.width;
      if (currentFish.x > canvas.width) currentFish.x = 0;
      if (currentFish.y < 0) currentFish.y = canvas.height;
      if (currentFish.y > canvas.height) currentFish.y = 0;
      
      // Age and energy dynamics
      currentFish.age += 0.1;
      currentFish.energy = 0.5 + 0.5 * Math.sin(currentFish.age * 0.01);
    });
    
    lastCompassRotation.current = compassRotation;
  }, [compassRotation]);

  // Draw individual fish with realistic appearance
  const drawFish = useCallback((ctx: CanvasRenderingContext2D, fish: Fish) => {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(fish.rotationAngle);
    
    // Fish size based on type and energy
    const sizeMultiplier = fish.type === 'leader' ? 1.3 : (fish.type === 'scout' ? 1.1 : 1.0);
    const currentSize = fish.size * sizeMultiplier * fish.energy;
    
    ctx.globalAlpha = fish.alpha * (0.7 + fish.energy * 0.3);
    ctx.strokeStyle = fish.color;
    ctx.fillStyle = fish.color;
    ctx.lineWidth = 1.5;
    
    // Draw fish body (elongated ellipse)
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.bodyLength, currentSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw fish tail with swimming animation
    const tailX = -fish.bodyLength * 0.8;
    const tailY = Math.sin(fish.tailOffset) * currentSize * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(tailX, 0);
    ctx.lineTo(tailX - currentSize * 2, tailY);
    ctx.lineTo(tailX - currentSize * 1.5, 0);
    ctx.lineTo(tailX - currentSize * 2, -tailY);
    ctx.closePath();
    ctx.fill();
    
    // Draw fish eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fish.bodyLength * 0.3, -currentSize * 0.3, currentSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(fish.bodyLength * 0.4, -currentSize * 0.3, currentSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.016;
    
    // Clear with slight trailing effect for fluid motion
    ctx.fillStyle = 'rgba(2, 12, 27, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updateFishMovement();
    
    // Draw fish schools
    fishRef.current.forEach(fish => {
      drawFish(ctx, fish);
    });
    
    animationFrameRef.current = requestAnimationFrame(render);
  }, [updateFishMovement, drawFish]);

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
    
    initializeFishSchool();
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeFishSchool, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 w-full h-full pointer-events-none ${className}`}
      style={{ 
        mixBlendMode: 'screen',
        opacity: 0.6,
        zIndex: 0
      }}
    />
  );
};

export default FishSchoolParticles;
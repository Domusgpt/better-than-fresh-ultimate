import React, { useEffect, useRef } from 'react';

interface OceanCurrentsProps {
  intensity?: number;
  scrollProgress?: number;
}

const OceanCurrents: React.FC<OceanCurrentsProps> = ({
  intensity = 1.0,
  scrollProgress = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velocityRef = useRef<{x: number[][], y: number[][]}>({ x: [], y: [] });
  const densityRef = useRef<number[][]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const width = 96;  // Fluid simulation grid
    const height = 54;

    // Initialize arrays
    const initArrays = () => {
      velocityRef.current = { x: [], y: [] };
      densityRef.current = [];

      for (let i = 0; i < width; i++) {
        velocityRef.current.x[i] = [];
        velocityRef.current.y[i] = [];
        densityRef.current[i] = [];
        for (let j = 0; j < height; j++) {
          velocityRef.current.x[i][j] = 0;
          velocityRef.current.y[i][j] = 0;
          densityRef.current[i][j] = 0;
        }
      }
    };

    initArrays();

    // Diffusion step
    const diffuse = (x: number[][], x0: number[][], diff: number, dt: number) => {
      const a = dt * diff * (width - 2) * (height - 2);
      const iterations = 4;

      for (let k = 0; k < iterations; k++) {
        for (let i = 1; i < width - 1; i++) {
          for (let j = 1; j < height - 1; j++) {
            x[i][j] = (x0[i][j] + a * (
              x[i - 1][j] + x[i + 1][j] +
              x[i][j - 1] + x[i][j + 1]
            )) / (1 + 4 * a);
          }
        }
      }
    };

    // Advection step
    const advect = (d: number[][], d0: number[][], velX: number[][], velY: number[][], dt: number) => {
      const dtx = dt * (width - 2);
      const dty = dt * (height - 2);

      for (let i = 1; i < width - 1; i++) {
        for (let j = 1; j < height - 1; j++) {
          let x = i - dtx * velX[i][j];
          let y = j - dty * velY[i][j];

          if (x < 0.5) x = 0.5;
          if (x > width - 1.5) x = width - 1.5;
          const i0 = Math.floor(x);
          const i1 = i0 + 1;

          if (y < 0.5) y = 0.5;
          if (y > height - 1.5) y = height - 1.5;
          const j0 = Math.floor(y);
          const j1 = j0 + 1;

          const s1 = x - i0;
          const s0 = 1 - s1;
          const t1 = y - j0;
          const t0 = 1 - t1;

          if (i0 >= 0 && i1 < width && j0 >= 0 && j1 < height) {
            d[i][j] = s0 * (t0 * d0[i0][j0] + t1 * d0[i0][j1]) +
                      s1 * (t0 * d0[i1][j0] + t1 * d0[i1][j1]);
          }
        }
      }
    };

    // Project step (make divergence free)
    const project = (velX: number[][], velY: number[][], p: number[][], div: number[][]) => {
      for (let i = 1; i < width - 1; i++) {
        for (let j = 1; j < height - 1; j++) {
          div[i][j] = -0.5 * (
            velX[i + 1][j] - velX[i - 1][j] +
            velY[i][j + 1] - velY[i][j - 1]
          ) / ((width + height) / 2);
          p[i][j] = 0;
        }
      }

      for (let k = 0; k < 4; k++) {
        for (let i = 1; i < width - 1; i++) {
          for (let j = 1; j < height - 1; j++) {
            p[i][j] = (div[i][j] + p[i - 1][j] + p[i + 1][j] +
                       p[i][j - 1] + p[i][j + 1]) / 4;
          }
        }
      }

      for (let i = 1; i < width - 1; i++) {
        for (let j = 1; j < height - 1; j++) {
          velX[i][j] -= 0.5 * (p[i + 1][j] - p[i - 1][j]) * width;
          velY[i][j] -= 0.5 * (p[i][j + 1] - p[i][j - 1]) * height;
        }
      }
    };

    // Nautical color palette - deep ocean currents
    const nauticalColors = [
      [10, 25, 47],      // Deep navy #0a192f
      [17, 34, 64],      // Ocean blue #112240
      [212, 175, 55],    // Antique gold #d4af37
      [100, 255, 218],   // Sea foam #64ffda
      [136, 146, 176],   // Silver mist #8892b0
    ];

    // Add ocean current forces
    let time = 0;
    const addForces = () => {
      time += 0.08;

      // Gulf Stream-like major current
      const streamX = Math.floor(width * 0.3);
      const streamY = Math.floor(height / 2 + Math.sin(time * 0.3) * height * 0.2);

      if (streamX > 0 && streamX < width && streamY > 0 && streamY < height) {
        const force = intensity * 0.4;
        velocityRef.current.x[streamX][streamY] += force;
        velocityRef.current.y[streamX][streamY] += Math.sin(time * 0.5) * force * 0.3;
        densityRef.current[streamX][streamY] = Math.min(densityRef.current[streamX][streamY] + 0.8, 1);
      }

      // Circular gyres
      for (let g = 0; g < 3; g++) {
        const gyreAngle = time * 0.2 + g * 2.1;
        const gyreCenterX = width * (0.3 + g * 0.25);
        const gyreCenterY = height * 0.5;
        const gyreRadius = 8 + g * 3;

        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2 + gyreAngle;
          const x = Math.floor(gyreCenterX + Math.cos(angle) * gyreRadius);
          const y = Math.floor(gyreCenterY + Math.sin(angle) * gyreRadius);

          if (x > 0 && x < width && y > 0 && y < height) {
            const tangentX = -Math.sin(angle) * intensity * 0.15;
            const tangentY = Math.cos(angle) * intensity * 0.15;
            velocityRef.current.x[x][y] += tangentX;
            velocityRef.current.y[x][y] += tangentY;

            // Add density with depth gradient
            densityRef.current[x][y] = Math.min(densityRef.current[x][y] + (g + 1) / 4, 1);
          }
        }
      }
    };

    // Step simulation
    const step = (dt: number) => {
      const visc = 0.000008;
      const diff = 0.00008;

      const velX0: number[][] = JSON.parse(JSON.stringify(velocityRef.current.x));
      const velY0: number[][] = JSON.parse(JSON.stringify(velocityRef.current.y));
      const s: number[][] = JSON.parse(JSON.stringify(densityRef.current));
      const p: number[][] = Array(width).fill(0).map(() => Array(height).fill(0));
      const div: number[][] = Array(width).fill(0).map(() => Array(height).fill(0));

      diffuse(velX0, velocityRef.current.x, visc, dt);
      diffuse(velY0, velocityRef.current.y, visc, dt);

      project(velX0, velY0, p, div);

      advect(velocityRef.current.x, velX0, velX0, velY0, dt);
      advect(velocityRef.current.y, velY0, velX0, velY0, dt);

      project(velocityRef.current.x, velocityRef.current.y, p, div);

      diffuse(s, densityRef.current, diff, dt);
      advect(densityRef.current, s, velocityRef.current.x, velocityRef.current.y, dt);

      // Fade density slowly
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          densityRef.current[i][j] *= 0.995;
        }
      }
    };

    // Render
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cellWidth = canvas.width / width;
      const cellHeight = canvas.height / height;

      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const d = Math.min(densityRef.current[i][j], 1);
          if (d > 0.01) {
            // Choose color based on density and position
            const colorIndex = Math.floor(d * 5) % 5;
            const color = nauticalColors[colorIndex];
            const alpha = d * 0.6 * (1 - scrollProgress * 0.3);

            // Add subtle gold highlights
            const isGold = d > 0.6 && (i + j) % 7 === 0;
            const finalColor = isGold ? nauticalColors[2] : color;

            ctx.fillStyle = `rgba(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]}, ${alpha})`;

            // Softer rendering with slight blur effect
            const x = i * cellWidth;
            const y = j * cellHeight;
            const w = cellWidth * 1.5;
            const h = cellHeight * 1.5;

            ctx.beginPath();
            ctx.arc(x + cellWidth / 2, y + cellHeight / 2, Math.max(w, h) / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    // Animation loop
    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      addForces();
      step(dt);
      render();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{
        mixBlendMode: 'screen',
        opacity: 0.35,
        zIndex: -5
      }}
    />
  );
};

export default OceanCurrents;

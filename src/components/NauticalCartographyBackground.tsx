import React, { useEffect, useRef, useState } from 'react';

interface NauticalCartographyBackgroundProps {
  scrollProgress?: number;
  sectionIndex?: number;
}

const NauticalCartographyBackground: React.FC<NauticalCartographyBackgroundProps> = ({
  scrollProgress = 0,
  sectionIndex = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      depth: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS animations');
      setWebglSupported(false);
      return;
    }

    glRef.current = gl;

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader - Nautical Cartography Raymarching
    const fragmentShaderSource = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_scroll;
      uniform float u_section;

      // Noise functions
      float hash(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = hash(i.x + i.y * 57.0);
        float b = hash(i.x + 1.0 + i.y * 57.0);
        float c = hash(i.x + (i.y + 1.0) * 57.0);
        float d = hash(i.x + 1.0 + (i.y + 1.0) * 57.0);

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;

        for(int i = 0; i < 6; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }

        return value;
      }

      // 4D rotation matrices for hyperdimensional navigation
      mat4 rotateXW(float theta) {
        float c = cos(theta);
        float s = sin(theta);
        return mat4(c, 0.0, 0.0, -s, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, s, 0.0, 0.0, c);
      }

      mat4 rotateYW(float theta) {
        float c = cos(theta);
        float s = sin(theta);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
      }

      mat4 rotateZW(float theta) {
        float c = cos(theta);
        float s = sin(theta);
        return mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c);
      }

      // Project 4D to 3D - like projecting nautical charts
      vec3 project4D(vec4 p) {
        float w = 2.5 / (2.5 + p.w);
        return vec3(p.xyz * w);
      }

      // Signed distance functions - oceanic forms
      float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
      }

      float sdSphere(vec3 p, float r) {
        return length(p) - r;
      }

      float sdOctahedron(vec3 p, float s) {
        p = abs(p);
        return (p.x + p.y + p.z - s) * 0.57735027;
      }

      // Compass rose geometry
      float sdCompassRose(vec3 p) {
        float angle = atan(p.z, p.x);
        float r = length(p.xz);
        float points = 8.0;
        float star = cos(angle * points) * 0.3 + 0.7;
        return r - star * 0.8 - abs(p.y) * 2.0;
      }

      // Smooth minimum for blending
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      // Nautical scene with oceanic geometry
      float scene(vec3 p) {
        float time = u_time * 0.00015;

        // 4D rotation - navigating through dimensions
        vec4 p4 = vec4(p, sin(time * 2.0 + u_scroll * 3.14159) * 1.5);
        p4 = rotateXW(time + u_mouse.x * 0.5) * p4;
        p4 = rotateYW(time * 0.7 + u_mouse.y * 0.5) * p4;
        p4 = rotateZW(time * 0.5 + u_scroll * 0.2) * p4;
        vec3 p3 = project4D(p4);

        // Ocean wave distortion
        float wavePhase = time * 5.0 + p3.x * 3.0 + p3.z * 2.0;
        float wave = sin(wavePhase) * 0.15 + sin(wavePhase * 2.3) * 0.08;
        p3.y += wave * (1.0 - u_scroll * 0.5);

        // Organic noise - sea currents
        float noiseDisp = fbm(p3.xz * 1.5 + time) * 0.2;
        p3 += vec3(noiseDisp * sin(time * 2.0), 0.0, noiseDisp * cos(time * 1.5));

        // Section-based geometry morphing
        float morphFactor = u_section / 4.0;

        // Main oceanic torus - the endless deep
        float d1 = sdTorus(p3, vec2(1.2 + morphFactor * 0.3, 0.3 + sin(time * 2.0) * 0.08));

        // Compass rose - navigation
        vec3 compassPos = p3 - vec3(sin(time) * 0.5, 0.0, cos(time * 0.7) * 0.5);
        float d2 = sdCompassRose(compassPos * 1.5) / 1.5;

        // Octahedral crystal - precision
        float d3 = sdOctahedron(p3, 0.9 + sin(time) * 0.15);

        // Sphere - the sun/moon celestial navigation
        float d4 = sdSphere(p3 - vec3(sin(time * 1.2), cos(time), 0.0) * 0.6, 0.5);

        // Smooth blend all forms
        float d = smin(d1, d2, 0.4);
        d = smin(d, d3, 0.5);
        d = smin(d, d4, 0.3);

        // Fine detail - ripples on surface
        d += sin(p3.x * 15.0 + time * 8.0) * sin(p3.y * 15.0 + time * 6.0) * sin(p3.z * 15.0 + time * 7.0) * 0.015;

        return d;
      }

      // Nautical cartography color palette
      vec3 getNauticalColor(float t, float depth) {
        // Deep ocean navy to bright gold progression
        vec3 abyssNavy = vec3(0.012, 0.031, 0.059);      // #020810 - the abyss
        vec3 deepNavy = vec3(0.039, 0.098, 0.184);       // #0a192f - deep water
        vec3 oceanBlue = vec3(0.067, 0.133, 0.251);      // #112240 - mid depth
        vec3 seaFoam = vec3(0.4, 0.6, 0.65);             // Sea foam green
        vec3 antiqueGold = vec3(0.831, 0.686, 0.216);    // #d4af37 - cartography gold
        vec3 brightGold = vec3(0.953, 0.796, 0.349);     // Bright gold accent
        vec3 copperRust = vec3(0.7, 0.4, 0.3);           // Aged copper
        vec3 parchment = vec3(0.9, 0.94, 1.0);           // #e6f1ff - light parchment

        t = mod(t, 5.0);

        // Color transitions based on depth and progress
        if (t < 1.0) return mix(abyssNavy, deepNavy, fract(t));
        else if (t < 2.0) return mix(deepNavy, oceanBlue, fract(t));
        else if (t < 3.0) return mix(oceanBlue, antiqueGold, fract(t));
        else if (t < 4.0) return mix(antiqueGold, seaFoam, fract(t));
        else return mix(seaFoam, parchment, fract(t));
      }

      // Calculate normal for lighting
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.001, 0.0);
        return normalize(vec3(
          scene(p + e.xyy) - scene(p - e.xyy),
          scene(p + e.yxy) - scene(p - e.yxy),
          scene(p + e.yyx) - scene(p - e.yyx)
        ));
      }

      // Raymarching through oceanic depths
      vec3 raymarch(vec3 ro, vec3 rd) {
        float t = 0.0;
        vec3 color = vec3(0.0);
        float glowAccum = 0.0;

        for (int i = 0; i < 64; i++) {
          vec3 p = ro + rd * t;
          float d = scene(p);

          // Surface hit
          if (d < 0.002) {
            vec3 normal = calcNormal(p);

            // Dual lighting - moonlight and bioluminescence
            vec3 lightDir1 = normalize(vec3(sin(u_time * 0.0001), 0.8, cos(u_time * 0.0001)));
            vec3 lightDir2 = normalize(vec3(-0.5, -0.3, 0.8));
            float diff1 = max(dot(normal, lightDir1), 0.0);
            float diff2 = max(dot(normal, lightDir2), 0.0) * 0.3;

            // Depth-based color
            float colorIndex = p.y * 2.0 + u_time * 0.0008 + u_scroll * 2.5 + u_section * 0.5;
            vec3 nauticalColor = getNauticalColor(colorIndex, t);

            // Fresnel - underwater caustics effect
            float fresnel = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);

            color = nauticalColor * ((diff1 + diff2) * 0.7 + 0.3) + fresnel * vec3(0.831, 0.686, 0.216) * 0.4;
            color += glowAccum * 0.4;
            break;
          }

          // Accumulate ethereal glow - bioluminescence
          float colorIdx = t * 0.2 + u_time * 0.0008 + u_scroll * 1.5;
          glowAccum += 0.004 / (1.0 + d * d) * (1.0 - float(i) / 64.0);
          color += getNauticalColor(colorIdx, t) * 0.002 / (1.0 + d * d);

          if (t > 25.0) break;
          t += d * 0.8;
        }

        // Add accumulated glow
        color += glowAccum * getNauticalColor(u_time * 0.0015 + u_scroll * 2.0, 1.0);

        return color;
      }

      // Depth sounding lines overlay
      float depthLines(vec2 uv, float time) {
        float lines = 0.0;

        // Horizontal depth contours
        for (float i = 0.0; i < 8.0; i++) {
          float y = sin(uv.x * 3.0 + time * 0.5 + i * 1.5) * 0.03 + (i / 8.0 - 0.5);
          float line = smoothstep(0.002, 0.0, abs(uv.y - y));
          lines += line * 0.15 * (1.0 - u_scroll);
        }

        return lines;
      }

      // Compass rose overlay
      float compassOverlay(vec2 uv, float time) {
        vec2 center = vec2(0.85, -0.35);
        vec2 p = uv - center;
        float r = length(p);
        float angle = atan(p.y, p.x);

        // Only show when scrolled
        float visibility = smoothstep(0.0, 0.3, u_scroll);

        // Compass points
        float points = abs(sin(angle * 4.0));
        float rose = smoothstep(0.08, 0.075, r) * points * visibility * 0.3;

        // Center circle
        rose += smoothstep(0.02, 0.015, r) * visibility * 0.5;

        return rose;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;

        // Camera with subtle oceanic drift
        float camAngle = u_time * 0.00008;
        vec3 ro = vec3(
          cos(camAngle) * 4.5 + (u_mouse.x - 0.5) * 2.0,
          sin(u_time * 0.0001) * 1.5 + (u_mouse.y - 0.5) * 2.0,
          sin(camAngle) * 4.5 + 4.0
        );

        vec3 target = vec3(0.0);
        vec3 forward = normalize(target - ro);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
        vec3 up = cross(forward, right);

        vec3 rd = normalize(forward + uv.x * right + uv.y * up);

        // Raymarch the nautical scene
        vec3 color = raymarch(ro, rd);

        // Add depth sounding lines
        float time = u_time * 0.0003;
        color += vec3(0.831, 0.686, 0.216) * depthLines(uv, time);

        // Add compass rose
        color += vec3(0.831, 0.686, 0.216) * compassOverlay(uv, time);

        // Background - pure black with subtle noise emergence
        float bgNoise = fbm(uv * 2.0 + u_time * 0.00005);
        vec3 bgColor = mix(
          vec3(0.008, 0.016, 0.031),  // Almost pure black
          vec3(0.02, 0.05, 0.08),      // Hint of deep navy
          uv.y * 0.3 + 0.3 + bgNoise * 0.15
        );

        // Blend background - more visible at start
        color += bgColor * (0.3 + (1.0 - u_scroll) * 0.2);

        // Vignette - deeper at edges for emergence effect
        float vignette = 1.0 - length(uv) * 0.5;
        color *= vignette;

        // Subtle scan lines for cartography texture
        float scanlines = sin(gl_FragCoord.y * 1.5) * 0.02 + 1.0;
        color *= scanlines;

        // Tone mapping
        color = color / (color + vec3(1.0));
        color = pow(color, vec3(1.0 / 2.2));

        gl_FragColor = vec4(color, 0.95);
      }
    `;

    // Compile shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    programRef.current = program;

    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const scrollLocation = gl.getUniformLocation(program, 'u_scroll');
    const sectionLocation = gl.getUniformLocation(program, 'u_section');

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      if (!gl || !program) return;

      const time = Date.now() - startTimeRef.current;

      gl.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(scrollLocation, scrollProgress);
      gl.uniform1f(sectionLocation, sectionIndex);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollProgress, sectionIndex]);

  // CSS Fallback Component
  const CSSFallback = () => (
    <div className="fixed top-0 left-0 w-full h-full -z-10" style={{ opacity: 0.85 }}>
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-800/20 to-emerald-900/30"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(8, 30, 59, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(40, 150, 200, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(100, 255, 218, 0.2) 0%, transparent 50%)
          `,
          animation: 'nautical-drift 20s ease-in-out infinite alternate'
        }}
      />
      
      {/* Animated compass rose patterns */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${20 + (i * 10)}%`,
              top: `${30 + (i * 5)}%`,
              animation: `compass-glow 3s ease-in-out infinite ${i * 0.5}s`,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>

      {/* Depth contour lines */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"
            style={{
              top: `${15 + (i * 15)}%`,
              animation: `depth-lines 8s ease-in-out infinite ${i * 1.2}s`,
              transform: `rotate(${i * 2}deg)`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes nautical-drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(20px, -15px) rotate(2deg); }
        }
        
        @keyframes compass-glow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        
        @keyframes depth-lines {
          0%, 100% { opacity: 0.1; transform: translateX(0); }
          50% { opacity: 0.4; transform: translateX(10px); }
        }
      `}</style>
    </div>
  );

  return webglSupported ? (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ mixBlendMode: 'screen', opacity: 0.85 }}
    />
  ) : (
    <CSSFallback />
  );
};

export default NauticalCartographyBackground;

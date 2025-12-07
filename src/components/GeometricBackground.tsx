
import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface Props {
  isExpanded: boolean;
  sectionIndex?: number;
  scrollProgress?: number;
}

// Sacred Oceanic Emergence - WebGL Shader System
// A Paul Phillips Manifestation

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_structure;        // 0.0 = chaos, 1.0 = sacred geometry
  uniform float u_scrollProgress;   // 0.0 to 1.0 overall scroll
  uniform int u_sectionId;          // Which section is active
  uniform vec2 u_mousePos;          // Normalized mouse position
  uniform float u_mouseInfluence;   // How much mouse affects the field
  uniform float u_expansion;        // Card expansion state

  // Noise configuration
  uniform float u_noiseScale;
  uniform float u_noiseSpeed;

  // Color system
  uniform float u_chaosHue;
  uniform float u_structureHue;
  uniform float u_accentHue;

  // === NOISE FUNCTIONS ===

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Fractal Brownian Motion
  float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
      if (i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // === COLOR FUNCTIONS ===

  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  // === SACRED GEOMETRY FUNCTIONS ===

  // Lotus petal shape
  float lotusPetal(vec2 uv, float angle, float petalLen, float width) {
    float a = atan(uv.y, uv.x);
    float r = length(uv);

    // Angular distance from petal center
    float angleDiff = abs(mod(a - angle + 3.14159, 6.28318) - 3.14159);

    // Petal shape: tapered ellipse
    float petalShape = smoothstep(width, 0.0, angleDiff) *
                       smoothstep(petalLen, petalLen * 0.3, r) *
                       smoothstep(0.0, petalLen * 0.2, r);

    return petalShape;
  }

  // Full lotus mandala
  float lotusMandala(vec2 uv, float time, float petalCount, float rings) {
    float lotus = 0.0;

    for (float ring = 0.0; ring < 4.0; ring++) {
      if (ring >= rings) break;

      float ringOffset = ring * 0.12;
      float ringPetals = petalCount - ring * 6.0;
      float ringRotation = time * (0.1 - ring * 0.02) + ring * 0.5;
      float petalWidth = 0.15 + ring * 0.05;
      float petalLen = 0.3 - ring * 0.05;

      for (float i = 0.0; i < 36.0; i++) {
        if (i >= ringPetals) break;

        float angle = (i / ringPetals) * 6.28318 + ringRotation;
        vec2 offset = vec2(cos(angle), sin(angle)) * ringOffset;

        lotus += lotusPetal(uv - offset, angle, petalLen, petalWidth) * (1.0 - ring * 0.15);
      }
    }

    return clamp(lotus, 0.0, 1.0);
  }

  // Radiating rays
  float sacredRays(vec2 uv, float time, float rayCount) {
    float a = atan(uv.y, uv.x);
    float r = length(uv);

    float rays = 0.0;
    for (float i = 0.0; i < 24.0; i++) {
      if (i >= rayCount) break;

      float rayAngle = (i / rayCount) * 6.28318 + time * 0.05;
      float rayDist = abs(mod(a - rayAngle + 3.14159, 6.28318 / rayCount) - 3.14159 / rayCount);

      rays += smoothstep(0.02, 0.0, rayDist) * smoothstep(0.8, 0.2, r) * smoothstep(0.0, 0.1, r);
    }

    return rays * 0.3;
  }

  // Concentric rings
  float concentricRings(vec2 uv, float time, float ringCount) {
    float r = length(uv);
    float rings = 0.0;

    for (float i = 0.0; i < 8.0; i++) {
      if (i >= ringCount) break;

      float ringRadius = 0.1 + i * 0.1 + sin(time * 0.5 + i) * 0.01;
      float ringWidth = 0.008 - i * 0.0005;

      rings += smoothstep(ringWidth, 0.0, abs(r - ringRadius)) * (1.0 - i * 0.1);
    }

    return rings;
  }

  // Golden spiral
  float goldenSpiral(vec2 uv, float time) {
    float a = atan(uv.y, uv.x);
    float r = length(uv);

    // Golden ratio spiral: r = a * phi^(theta/90°)
    float phi = 1.618033988749;
    float spiral = 0.0;

    for (float i = 0.0; i < 3.0; i++) {
      float offset = i * 2.094; // 120 degrees
      float expectedR = 0.02 * pow(phi, (a + offset + time * 0.2) / 1.5708);
      spiral += smoothstep(0.02, 0.0, abs(r - mod(expectedR, 0.5)));
    }

    return spiral * 0.5;
  }

  // === SECTION-SPECIFIC EFFECTS ===

  vec3 heroEffect(vec2 uv, float time, float structure) {
    // Surface turbulence - chaos dominant
    float noise1 = fbm(vec3(uv * 3.0, time * 0.15), 4);
    float noise2 = fbm(vec3(uv * 6.0 + 100.0, time * 0.2), 3);
    float noise3 = fbm(vec3(uv * 1.5 + 200.0, time * 0.1), 5);

    float chaos = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

    // Hint of emerging structure
    float preStructure = lotusMandala(uv - 0.5, time, 12.0, 1.0) * structure * 0.3;

    // Colors: teal-green chaos
    vec3 chaosColor = hsl2rgb(u_chaosHue / 360.0, 0.7, 0.15 + chaos * 0.25);
    vec3 structColor = hsl2rgb(0.5, 0.6, 0.2 + preStructure * 0.3);

    return mix(chaosColor, structColor, preStructure);
  }

  vec3 frozenEffect(vec2 uv, float time, float structure) {
    // Crystalline frost patterns
    float noise = fbm(vec3(uv * 8.0, time * 0.05), 3);

    // Hexagonal crystalline pattern
    vec2 hex = uv * 10.0;
    float hexPattern = sin(hex.x * 1.732 + hex.y) * sin(hex.x * 1.732 - hex.y) * sin(hex.y * 2.0);
    hexPattern = smoothstep(0.0, 0.3, abs(hexPattern));

    float crystal = mix(noise, hexPattern, structure);

    // Ice blue colors
    vec3 iceColor = hsl2rgb(200.0 / 360.0, 0.6, 0.1 + crystal * 0.3);
    vec3 frostColor = hsl2rgb(210.0 / 360.0, 0.5, 0.2 + crystal * 0.2);

    return mix(iceColor, frostColor, structure);
  }

  vec3 productEffect(vec2 uv, float time, float structure) {
    // Lotus emergence with gold
    vec2 center = uv - 0.5;

    float noise = fbm(vec3(uv * 4.0, time * 0.1), 3) * (1.0 - structure);
    float lotus = lotusMandala(center, time, 24.0, 2.0) * structure;
    float rings = concentricRings(center, time, 5.0) * structure * 0.5;

    // Teal to gold transition
    vec3 chaosColor = hsl2rgb(u_chaosHue / 360.0, 0.6, 0.12 + noise * 0.2);
    vec3 lotusColor = hsl2rgb(u_accentHue / 360.0, 0.8, 0.25 + lotus * 0.35);
    vec3 ringColor = hsl2rgb(u_accentHue / 360.0, 0.5, 0.15 + rings * 0.25);

    return mix(chaosColor, lotusColor + ringColor, structure);
  }

  vec3 catalogEffect(vec2 uv, float time, float structure) {
    // Full mandala bloom
    vec2 center = uv - 0.5;

    float noise = fbm(vec3(uv * 3.0, time * 0.08), 4) * (1.0 - structure * 0.7);
    float lotus = lotusMandala(center, time, 36.0, 3.0) * structure;
    float rays = sacredRays(center, time, 24.0) * structure;
    float rings = concentricRings(center, time, 8.0) * structure * 0.4;
    float spiral = goldenSpiral(center, time) * structure * 0.3;

    // Purple to gold mandala
    vec3 baseColor = hsl2rgb(u_structureHue / 360.0, 0.5, 0.08 + noise * 0.15);
    vec3 lotusColor = hsl2rgb(u_accentHue / 360.0, 0.85, 0.3 + lotus * 0.4);
    vec3 rayColor = hsl2rgb((u_structureHue - 30.0) / 360.0, 0.7, 0.2);

    vec3 result = baseColor;
    result = mix(result, lotusColor, lotus);
    result += rayColor * rays;
    result += hsl2rgb(u_accentHue / 360.0, 0.6, rings);
    result += hsl2rgb(u_accentHue / 360.0, 0.7, spiral);

    return result;
  }

  vec3 ethosEffect(vec2 uv, float time, float structure) {
    // Chain geometry - interconnected nodes
    vec2 center = uv - 0.5;

    float noise = fbm(vec3(uv * 5.0, time * 0.12), 3);

    // Create chain-link pattern
    float chain = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
      float angle = i * 1.047 + time * 0.1;
      vec2 nodePos = vec2(cos(angle), sin(angle)) * 0.25;
      float nodeDist = length(center - nodePos);
      chain += smoothstep(0.05, 0.02, nodeDist);

      // Connections between nodes
      vec2 nextPos = vec2(cos(angle + 1.047), sin(angle + 1.047)) * 0.25;
      vec2 lineDir = normalize(nextPos - nodePos);
      vec2 toPoint = center - nodePos;
      float lineDist = abs(dot(toPoint, vec2(-lineDir.y, lineDir.x)));
      float lineProgress = dot(toPoint, lineDir);
      if (lineProgress > 0.0 && lineProgress < length(nextPos - nodePos)) {
        chain += smoothstep(0.015, 0.005, lineDist) * 0.5;
      }
    }

    float lotus = lotusMandala(center, time, 18.0, 2.0) * structure * 0.5;

    // Blue to purple chain
    vec3 baseColor = hsl2rgb(200.0 / 360.0, 0.5, 0.1 + noise * (1.0 - structure) * 0.2);
    vec3 chainColor = hsl2rgb(u_structureHue / 360.0, 0.7, 0.25);
    vec3 lotusColor = hsl2rgb(u_accentHue / 360.0, 0.6, 0.2 + lotus * 0.3);

    return baseColor + chainColor * chain * structure + lotusColor;
  }

  // === MAIN ===

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uvAspect = (uv - 0.5) * aspect + 0.5;

    // Mouse influence on local field
    vec2 mouseOffset = (u_mousePos - 0.5) * u_mouseInfluence;
    vec2 uvMouse = uvAspect + mouseOffset * (1.0 - u_structure * 0.5);

    // Time with scroll influence
    float animTime = u_time + u_scrollProgress * 2.0;

    // Expansion effect - rush toward center
    float expansionPull = u_expansion * 0.3;
    vec2 center = vec2(0.5);
    vec2 toCenter = center - uvAspect;
    vec2 uvExpanded = uvAspect + toCenter * expansionPull;

    // Select effect based on section
    vec3 color;

    if (u_sectionId == 0) {
      // Hero - surface chaos
      color = heroEffect(uvExpanded, animTime, u_structure);
    } else if (u_sectionId == 1) {
      // Frozen Standard - crystalline
      color = frozenEffect(uvExpanded, animTime, u_structure);
    } else if (u_sectionId == 2) {
      // Product - lotus emergence
      color = productEffect(uvExpanded, animTime, u_structure);
    } else if (u_sectionId == 3) {
      // Catalog - full mandala
      color = catalogEffect(uvExpanded, animTime, u_structure);
    } else if (u_sectionId == 4) {
      // Ethos - chain geometry
      color = ethosEffect(uvExpanded, animTime, u_structure);
    } else {
      // Default/Footer - calm depths
      float noise = fbm(vec3(uvExpanded * 2.0, animTime * 0.05), 3);
      float lotus = lotusMandala(uvExpanded - 0.5, animTime, 36.0, 3.0);

      vec3 deepColor = hsl2rgb(240.0 / 360.0, 0.4, 0.08 + noise * 0.1);
      vec3 calmLotus = hsl2rgb(260.0 / 360.0, 0.3, 0.1 + lotus * 0.15);

      color = mix(deepColor, calmLotus, u_structure);
    }

    // Global vignette
    float vignette = 1.0 - length(uvAspect - 0.5) * 0.8;
    color *= vignette;

    // Subtle film grain
    float grain = (fract(sin(dot(uv, vec2(12.9898, 78.233) + u_time)) * 43758.5453) - 0.5) * 0.03;
    color += grain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const GeometricBackground: React.FC<Props> = ({
  isExpanded,
  sectionIndex = 0,
  scrollProgress = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Uniform locations
  const uniformsRef = useRef<{
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    structure: WebGLUniformLocation | null;
    scrollProgress: WebGLUniformLocation | null;
    sectionId: WebGLUniformLocation | null;
    mousePos: WebGLUniformLocation | null;
    mouseInfluence: WebGLUniformLocation | null;
    expansion: WebGLUniformLocation | null;
    noiseScale: WebGLUniformLocation | null;
    noiseSpeed: WebGLUniformLocation | null;
    chaosHue: WebGLUniformLocation | null;
    structureHue: WebGLUniformLocation | null;
    accentHue: WebGLUniformLocation | null;
  }>({
    resolution: null,
    time: null,
    structure: null,
    scrollProgress: null,
    sectionId: null,
    mousePos: null,
    mouseInfluence: null,
    expansion: null,
    noiseScale: null,
    noiseSpeed: null,
    chaosHue: null,
    structureHue: null,
    accentHue: null
  });

  // Animation state
  const stateRef = useRef({
    structure: 0.0,
    targetStructure: 0.0,
    sectionId: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    expansion: 0.0,
    targetExpansion: 0.0
  });

  // Compile shader
  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }, []);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Compile shaders
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Set up geometry (fullscreen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      structure: gl.getUniformLocation(program, 'u_structure'),
      scrollProgress: gl.getUniformLocation(program, 'u_scrollProgress'),
      sectionId: gl.getUniformLocation(program, 'u_sectionId'),
      mousePos: gl.getUniformLocation(program, 'u_mousePos'),
      mouseInfluence: gl.getUniformLocation(program, 'u_mouseInfluence'),
      expansion: gl.getUniformLocation(program, 'u_expansion'),
      noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
      noiseSpeed: gl.getUniformLocation(program, 'u_noiseSpeed'),
      chaosHue: gl.getUniformLocation(program, 'u_chaosHue'),
      structureHue: gl.getUniformLocation(program, 'u_structureHue'),
      accentHue: gl.getUniformLocation(program, 'u_accentHue')
    };

    // Set static uniforms
    gl.uniform1f(uniformsRef.current.noiseScale, 0.003);
    gl.uniform1f(uniformsRef.current.noiseSpeed, 0.15);
    gl.uniform1f(uniformsRef.current.chaosHue, 160.0);
    gl.uniform1f(uniformsRef.current.structureHue, 280.0);
    gl.uniform1f(uniformsRef.current.accentHue, 45.0);
    gl.uniform1f(uniformsRef.current.mouseInfluence, 0.15);

    // Handle resize
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.mouseX = e.clientX / window.innerWidth;
      stateRef.current.mouseY = 1.0 - e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const render = () => {
      const gl = glRef.current;
      const program = programRef.current;
      const uniforms = uniformsRef.current;
      const state = stateRef.current;

      if (!gl || !program) return;

      // Smooth interpolation
      state.structure += (state.targetStructure - state.structure) * 0.05;
      state.expansion += (state.targetExpansion - state.expansion) * 0.08;

      const time = (Date.now() - startTimeRef.current) / 1000;

      // Update uniforms
      gl.uniform2f(uniforms.resolution, canvasRef.current!.width, canvasRef.current!.height);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.structure, state.structure);
      gl.uniform1f(uniforms.scrollProgress, scrollProgress);
      gl.uniform1i(uniforms.sectionId, state.sectionId);
      gl.uniform2f(uniforms.mousePos, state.mouseX, state.mouseY);
      gl.uniform1f(uniforms.expansion, state.expansion);

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [compileShader]);

  // Update section and structure based on props
  useEffect(() => {
    const state = stateRef.current;
    state.sectionId = sectionIndex;

    // Structure levels per section
    const structureLevels = [0.1, 0.4, 0.6, 0.85, 0.7, 0.95];
    state.targetStructure = structureLevels[Math.min(sectionIndex, structureLevels.length - 1)] || 0.5;
  }, [sectionIndex]);

  // Handle expansion state
  useEffect(() => {
    stateRef.current.targetExpansion = isExpanded ? 1.0 : 0.0;

    // When expanded, boost structure toward full mandala
    if (isExpanded) {
      gsap.to(stateRef.current, {
        targetStructure: 0.95,
        duration: 1.2,
        ease: 'power2.inOut'
      });
    }
  }, [isExpanded]);

  // Update scroll progress
  useEffect(() => {
    // Scroll progress affects base structure level
    const baseStructure = 0.1 + scrollProgress * 0.6;
    if (!isExpanded) {
      stateRef.current.targetStructure = Math.max(
        stateRef.current.targetStructure,
        baseStructure
      );
    }
  }, [scrollProgress, isExpanded]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      {/* Overlay vignette for extra depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(2, 12, 27, 0.4) 100%)'
        }}
      />
    </div>
  );
};

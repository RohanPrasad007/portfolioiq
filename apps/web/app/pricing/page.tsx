"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "../providers";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { motion } from "framer-motion";

/* ─── WebGL Shader Background (Identical to Home Page) ─── */
function ShaderBackground({ theme }: { theme: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDarkRef = useRef(theme === "dark");

  useEffect(() => {
    isDarkRef.current = theme === "dark";
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_is_dark;
      varying vec2 v_texCoord;

      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise2d(vec2 p) {
        const float K1 = 0.366025404;
        const float K2 = 0.211324865;
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        float h = step(a.y, a.x);
        vec2 o = vec2(h, 1.0 - h);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        vec3 h3 = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
        vec3 n = h3 * h3 * h3 * h3 * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + vec2(1.0))));
        return dot(n, vec3(70.0));
      }

      float fbm(vec2 p) {
        float f = 0.0;
        f += 0.5000 * noise2d(p); p = p * 2.02;
        f += 0.2500 * noise2d(p); p = p * 2.03;
        f += 0.1250 * noise2d(p); p = p * 2.01;
        f += 0.0625 * noise2d(p);
        return f;
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouseUv = u_mouse / u_resolution;
        float distToMouse = distance(uv, mouseUv);

        if (u_is_dark > 0.5) {
          // ─── Dark Mode: Deep Cosmic Space Nebula ───
          vec2 q = vec2(
            fbm(uv * 3.0 + vec2(0.0, u_time * 0.1)),
            fbm(uv * 3.0 + vec2(5.2 + u_time * 0.08, 1.3))
          );
          
          vec2 r = vec2(
            fbm(uv * 3.0 + 4.0 * q + vec2(1.7, 9.2 + u_time * 0.15)),
            fbm(uv * 3.0 + 4.0 * q + vec2(8.3 + u_time * 0.12, 2.8))
          );

          float mouseForce = smoothstep(0.4, 0.0, distToMouse);
          r += (uv - mouseUv) * mouseForce * 0.15;

          float f = fbm(uv * 3.0 + 4.0 * r);

          vec3 baseColor = vec3(0.03, 0.03, 0.06);
          vec3 color1 = vec3(0.12, 0.14, 0.45);
          vec3 color2 = vec3(0.38, 0.15, 0.65);
          vec3 core = vec3(0.0, 0.70, 0.90);

          vec3 color = mix(baseColor, color1, clamp(f * 2.0, 0.0, 1.0));
          color = mix(color, color2, clamp(length(q), 0.0, 1.0) * 0.55);
          color = mix(color, core, clamp(length(r.x), 0.0, 1.0) * 0.22);
          color += vec3(0.1, 0.2, 0.45) * mouseForce * 0.3;

          float distToCenter = distance(uv, vec2(0.5));
          color *= 1.0 - distToCenter * 0.55;

          gl_FragColor = vec4(color, 1.0);
        } else {
          // ─── Light Mode: Flowing Silk Mesh Gradient ───
          vec2 q = vec2(
            fbm(uv * 2.2 + vec2(2.0, 3.5 + u_time * 0.04)),
            fbm(uv * 2.2 + vec2(8.2 + u_time * 0.05, 1.1))
          );

          vec2 r = vec2(
            fbm(uv * 2.0 + 3.0 * q + vec2(5.0, 2.0 - u_time * 0.05)),
            fbm(uv * 2.0 + 3.0 * q + vec2(1.0 + u_time * 0.04, 7.0))
          );

          float mouseForce = smoothstep(0.35, 0.0, distToMouse);
          r += (uv - mouseUv) * mouseForce * 0.1;

          float f = fbm(uv * 2.0 + 3.0 * r);

          vec3 baseColor = vec3(0.97, 0.975, 1.0);
          vec3 color1 = vec3(0.72, 0.74, 0.94);
          vec3 color2 = vec3(0.85, 0.78, 0.95);
          vec3 color3 = vec3(0.95, 0.82, 0.88);
          vec3 color4 = vec3(0.80, 0.92, 0.96);

          vec3 color = baseColor;
          color = mix(color, color1, clamp(f * 1.5, 0.0, 1.0) * 0.35);
          color = mix(color, color2, clamp(length(q), 0.0, 1.0) * 0.25);
          color = mix(color, color3, clamp(r.x * 2.0, 0.0, 1.0) * 0.2);
          color = mix(color, color4, clamp(r.y * 1.5, 0.0, 1.0) * 0.15);
          color = mix(color, color4 * 0.9 + 0.1, mouseForce * 0.15);

          color = clamp(color, vec3(0.92), vec3(1.0));
          gl_FragColor = vec4(color, 1.0);
        }
      }
    `;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type);
      if (!s) return null;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;

    const vertexShader = cs(gl.VERTEX_SHADER, vs);
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uIsDark = gl.getUniformLocation(prog, "u_is_dark");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);

    let animId: number;
    function render(t: number) {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.0008);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      if (uIsDark) gl.uniform1f(uIsDark, isDarkRef.current ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    
    render(0);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-300 ${
      theme === "dark" ? "opacity-85" : "opacity-90"
    }`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

/* ─── Stagger Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUpSpring = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 85, damping: 18 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);
  const { theme } = useTheme();
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDemo(!!window.localStorage.getItem("demo_token"));
    }
  }, []);

  const handleCTA = (planName: string) => {
    if (session || isDemo) {
      if (planName === "Free") {
        router.push("/dashboard");
      } else {
        setModalMessage(`Thank you for selecting the ${planName} Plan! This is a mock upgrade action for our product showcase.`);
      }
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="bg-surface dark:bg-surface-dark text-on-surface dark:text-inverse-on-surface min-h-screen flex flex-col font-body-base transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-border-subtle dark:border-border-subtle">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 max-w-container-max mx-auto">
          <div className="flex items-center gap-8">
            <motion.span 
              className="font-display-lg text-headline-md tracking-tight text-primary dark:text-primary-fixed-dim cursor-pointer" 
              onClick={() => router.push("/")}
              whileHover={{ scale: 1.03, textShadow: "0 0 20px rgba(68,80,183,0.4)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              PortfolioIQ
            </motion.span>
            <div className="hidden md:flex gap-6">
              <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="/">Product</Link>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="/#features">Features</a>
              <Link className="text-primary dark:text-primary-fixed-dim font-semibold border-b-2 border-primary pb-1 font-body-base text-body-base" href="/pricing">Pricing</Link>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="#">Docs</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session || isDemo ? (
              <motion.button 
                onClick={() => router.push("/dashboard")}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body-base text-body-base font-semibold hover:opacity-90 active:scale-[0.98] transition-primary cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Go to Dashboard
              </motion.button>
            ) : (
              <motion.button 
                onClick={() => router.push("/login")}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body-base text-body-base font-semibold hover:opacity-90 active:scale-[0.98] transition-primary cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Connect GitHub
              </motion.button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Pricing Section */}
      <main className="pt-16 grow overflow-hidden">
        
        {/* Header Hero Section */}
        <section className="relative min-h-[45vh] flex flex-col items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop py-20">
          <ShaderBackground theme={theme} />
          
          {/* Floating Orbs */}
          <div className="floating-orb floating-orb-1" style={{ width: 350, height: 350, top: '5%', left: '3%', background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }} />
          <div className="floating-orb floating-orb-2" style={{ width: 300, height: 300, top: '50%', right: '2%', background: 'radial-gradient(circle, rgba(244,63,94,0.4), transparent)' }} />
          <div className="floating-orb floating-orb-4" style={{ width: 250, height: 250, top: '15%', right: '18%', background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)' }} />
          <div className="floating-orb floating-orb-5" style={{ width: 200, height: 200, top: '40%', left: '38%', background: 'radial-gradient(circle, rgba(245,158,11,0.3), transparent)' }} />

          <motion.div 
            className="relative z-10 text-center max-w-4xl mx-auto space-y-6 px-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp}>
              <div className="shimmer-badge inline-flex items-center gap-2 bg-primary/15 text-primary dark:text-primary-fixed-dim border border-primary/40 dark:border-primary/30 px-5 py-2 rounded-full mb-2">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="font-label-caps tracking-widest text-xs font-semibold">FLEXIBLE STRATEGY</span>
              </div>
            </motion.div>
            <motion.h1 
              variants={fadeUp}
              className="font-display-lg text-5xl md:text-6xl leading-tight text-on-surface dark:text-white font-bold tracking-tight"
            >
              Scale your profile intelligence
            </motion.h1>
            <motion.p 
              variants={fadeUp}
              className="font-body-base text-lg md:text-xl text-on-surface-variant dark:text-surface-variant/90 max-w-2xl mx-auto leading-relaxed"
            >
              Transparent, performance-focused pricing designed for developers and scaling engineering teams.
            </motion.p>
          </motion.div>
        </section>

        {/* Pricing Cards Grid */}
        <section className="py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto -mt-8 relative z-20">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            
            {/* Free Plan */}
            <motion.div 
              variants={fadeUpSpring}
              className="group glass-card p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-linear-to-br from-emerald-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:to-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant dark:text-surface-variant font-display-lg">Free</span>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:to-cyan-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-xl">package_2</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-bold text-on-surface dark:text-white font-display-lg">$0</span>
                  <span className="text-sm text-on-surface-variant dark:text-surface-variant">/mo</span>
                </div>
                <p className="text-sm text-on-surface-variant dark:text-surface-variant/80 mb-6 leading-relaxed">
                  For solo developers looking to audit their personal profiles.
                </p>
                <ul className="space-y-4 mb-8 text-sm text-on-surface dark:text-white/95">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>1 Repository Scan</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Basic Resume AI Review</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>7-day History</span>
                  </li>
                </ul>
              </div>
              
              <div className="relative z-10 pt-4">
                <motion.button 
                  onClick={() => handleCTA("Free")}
                  className="w-full py-3.5 border border-outline dark:border-outline/40 hover:bg-surface-variant/20 dark:hover:bg-white/5 text-on-surface dark:text-white font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center text-sm font-display-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Building
                </motion.button>
              </div>
            </motion.div>
 
            {/* Pro Plan */}
            <motion.div 
              variants={fadeUpSpring}
              className="group glass-card p-8 rounded-2xl flex flex-col justify-between border-2 border-primary/60 dark:border-primary/50 relative overflow-hidden shadow-2xl shadow-primary/10 dark:shadow-primary/5"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-linear-to-br from-primary-container/20 to-violet-500/30 dark:from-primary/15 dark:to-violet-500/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-widest uppercase text-primary dark:text-primary-fixed-dim font-display-lg">Pro</span>
                    <span className="bg-primary/15 text-primary dark:text-primary-fixed-dim text-[9px] tracking-widest font-extrabold px-3 py-1 rounded-full uppercase border border-primary/20">
                      Most Popular
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-violet-500/20 dark:from-primary/10 dark:to-violet-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-xl">flash_on</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-on-surface dark:text-white font-display-lg">$49</span>
                    <span className="text-sm text-on-surface-variant dark:text-surface-variant">/mo</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant dark:text-surface-variant/80 mb-6 leading-relaxed">
                  For growing engineers and professionals targeting top-tier teams.
                </p>
                <ul className="space-y-4 mb-8 text-sm text-on-surface dark:text-white/95">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Unlimited Repos &amp; PDF Resumes</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Deep-Dive AI Career Audit</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>AI Heuristics Analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Priority Interview Coaching</span>
                  </li>
                </ul>
              </div>
              
              <div className="relative z-10 pt-4">
                <motion.button 
                  onClick={() => handleCTA("Pro")}
                  className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer text-center text-sm font-display-lg"
                  whileHover={{ scale: 1.02, boxShadow: "0 15px 30px -5px rgba(68,80,183,0.35)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Deploy Pro
                </motion.button>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
              variants={fadeUpSpring}
              className="group glass-card p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-linear-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant dark:text-surface-variant font-display-lg">Enterprise</span>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-xl">hub</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-bold text-on-surface dark:text-white font-display-lg">Custom</span>
                </div>
                <p className="text-sm text-on-surface-variant dark:text-surface-variant/80 mb-6 leading-relaxed">
                  For institutions scaling hiring and compliance validation globally.
                </p>
                <ul className="space-y-4 mb-8 text-sm text-on-surface dark:text-white/95">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Custom AI Heuristics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>API Access &amp; Webhooks</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>Dedicated Career Advisor</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span>24/7 Priority Support</span>
                  </li>
                </ul>
              </div>
              
              <div className="relative z-10 pt-4">
                <motion.button 
                  onClick={() => handleCTA("Enterprise")}
                  className="w-full py-3.5 border border-outline dark:border-outline/40 hover:bg-surface-variant/20 dark:hover:bg-white/5 text-on-surface dark:text-white font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center text-sm font-display-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact Sales
                </motion.button>
              </div>
            </motion.div>

          </motion.div>
        </section>

        {/* Technical Specification comparison table */}
        <section className="py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface dark:text-white">Heuristic Matrix</h2>
            <p className="text-sm text-on-surface-variant dark:text-surface-variant/75 mt-1 font-body-sm">
              Deep-dive into engine capabilities and diagnostic limits.
            </p>
          </motion.div>
          
          <motion.div 
            className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/30 dark:border-border-subtle shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm min-w-[640px]">
                <thead>
                  <tr className="bg-surface-variant/10 dark:bg-surface-dark text-[10px] md:text-[11px] font-bold text-on-surface-variant dark:text-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-5 border-b border-outline-variant/20 dark:border-border-subtle font-semibold font-display-lg">Capabilities</th>
                    <th className="px-6 py-5 border-b border-outline-variant/20 dark:border-border-subtle font-semibold font-display-lg">Free</th>
                    <th className="px-6 py-5 border-b border-outline-variant/20 dark:border-border-subtle font-semibold font-display-lg">Pro</th>
                    <th className="px-6 py-5 border-b border-outline-variant/20 dark:border-border-subtle font-semibold font-display-lg">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 dark:divide-border-subtle text-xs md:text-sm text-on-surface dark:text-white/95">
                  <tr className="hover:bg-primary/5 dark:hover:bg-primary-fixed-dim/2 transition-colors">
                    <td className="px-6 py-5 font-semibold">Analysis Depth</td>
                    <td className="px-6 py-5 text-on-surface-variant dark:text-surface-variant/90">Static Scan</td>
                    <td className="px-6 py-5 text-primary dark:text-primary-fixed-dim font-medium">Heuristic Deep-Dive</td>
                    <td className="px-6 py-5 font-semibold">Neural Audit + Custom</td>
                  </tr>
                  <tr className="hover:bg-primary/5 dark:hover:bg-primary-fixed-dim/2 transition-colors">
                    <td className="px-6 py-5 font-semibold">Resume Analysis</td>
                    <td className="px-6 py-5 text-on-surface-variant dark:text-surface-variant/60">Basic Check</td>
                    <td className="px-6 py-5 text-primary dark:text-primary-fixed-dim font-medium">Unlimited Scans</td>
                    <td className="px-6 py-5">Dedicated Coaching</td>
                  </tr>
                  <tr className="hover:bg-primary/5 dark:hover:bg-primary-fixed-dim/2 transition-colors">
                    <td className="px-6 py-5 font-semibold">Mock Interviews</td>
                    <td className="px-6 py-5 text-on-surface-variant dark:text-surface-variant/60">—</td>
                    <td className="px-6 py-5 text-primary dark:text-primary-fixed-dim font-medium">3 / Month</td>
                    <td className="px-6 py-5">Unlimited Sessions</td>
                  </tr>
                  <tr className="hover:bg-primary/5 dark:hover:bg-primary-fixed-dim/2 transition-colors">
                    <td className="px-6 py-5 font-semibold">AI Engine Model</td>
                    <td className="px-6 py-5 text-on-surface-variant dark:text-surface-variant/90">Gemini 1.5 Flash</td>
                    <td className="px-6 py-5 text-primary dark:text-primary-fixed-dim font-medium">Gemini 1.5 Pro</td>
                    <td className="px-6 py-5">Fine-tuned Custom LLM</td>
                  </tr>
                  <tr className="hover:bg-primary/5 dark:hover:bg-primary-fixed-dim/2 transition-colors">
                    <td className="px-6 py-5 font-semibold">API Access</td>
                    <td className="px-6 py-5 text-on-surface-variant dark:text-surface-variant/60">Disabled</td>
                    <td className="px-6 py-5 text-primary dark:text-primary-fixed-dim font-medium">Read-Only Keys</td>
                    <td className="px-6 py-5">Custom Webhooks &amp; SDK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* Bottom CTA Integration Section */}
        <section className="py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <motion.div 
            className="rounded-3xl bg-surface-container dark:bg-surface-dark border border-outline-variant/30 dark:border-border-subtle p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          >
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-primary/5 dark:from-primary/5 dark:via-transparent dark:to-primary/5 pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-on-surface dark:text-white">
                Built for the next generation of engineers.
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant dark:text-surface-variant leading-relaxed">
                Unlock instant evaluation and accelerate your resume validation inside your local environment in under 5 minutes.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <motion.button 
                  onClick={() => handleCTA("Pro")}
                  className="btn-glow bg-primary text-white px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Get Started Now
                </motion.button>
                <motion.button 
                  onClick={() => alert("Redirecting to documentation...")}
                  className="bg-transparent border border-outline dark:border-outline/40 text-on-surface dark:text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-surface-variant/10 transition-all cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  View Docs
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-surface dark:bg-surface-dark border-t border-outline-variant/30 dark:border-border-subtle mt-12 transition-colors duration-200 z-10 relative">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left space-y-1">
            <span className="font-display-lg text-lg text-primary dark:text-primary-fixed-dim font-bold">PORTFOLIOIQ</span>
            <p className="text-[11px] text-on-surface-variant dark:text-surface-variant/65">
              © 2026 PortfolioIQ Inc. Advanced Diagnostic Intelligence for Technical Professionals.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[11px] font-body-sm text-on-surface-variant dark:text-surface-variant/80">
            <a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Documentation</a>
            <a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">API Status</a>
            <a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Security</a>
            <a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Privacy</a>
            <a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Terms</a>
          </div>
        </div>
      </footer>

      {/* Mock Upgrade Alert Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#181a1e] border border-outline-variant/30 dark:border-border-subtle p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <h4 className="font-headline-md text-lg text-on-surface dark:text-white font-semibold">Plan Selected</h4>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-surface-variant/90 leading-relaxed">
              {modalMessage}
            </p>
            <button 
              onClick={() => {
                setModalMessage(null);
                router.push("/dashboard");
              }}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

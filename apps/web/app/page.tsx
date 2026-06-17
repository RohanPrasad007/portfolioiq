"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "./providers";
import Link from "next/link";
import { motion, useInView, useSpring, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeUpSpring = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 18 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return { count, ref };
}

/* ─── WebGL Shader Background ─── */
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

/* ─── Marquee Data ─── */
const techBadges = [
  { icon: "terminal", label: "GitHub Analytics" },
  { icon: "picture_as_pdf", label: "PDF Parsing" },
  { icon: "psychology", label: "Google Gemini" },
  { icon: "database", label: "MongoDB Atlas" },
  { icon: "cached", label: "Redis Queue" },
  { icon: "cloud_upload", label: "Cloudinary CDN" },
  { icon: "code", label: "TypeScript" },
  { icon: "speed", label: "Real-Time Analysis" },
];

/* ─── Features Data ─── */
const features = [
  {
    icon: "description",
    title: "Resume Intelligence",
    description: "Deep semantic analysis of your experience. We identify missing keywords and weak bullet points that AI screeners ignore.",
    gradient: "from-indigo-500/20 to-violet-500/20",
    darkGradient: "dark:from-indigo-500/10 dark:to-violet-500/10",
    iconColor: "text-primary dark:text-primary-fixed-dim",
  },
  {
    icon: "code",
    title: "GitHub Code Audit",
    description: "We scan your repositories for documentation quality, commit frequency, and technical complexity to prove you can ship production code.",
    gradient: "from-emerald-500/20 to-cyan-500/20",
    darkGradient: "dark:from-emerald-500/10 dark:to-cyan-500/10",
    iconColor: "text-secondary dark:text-secondary-fixed-dim",
  },
  {
    icon: "analytics",
    title: "Job Match Scoring",
    description: "Instant compatibility rating for specific job descriptions. See exactly where your skills gap exists for your dream role.",
    gradient: "from-amber-500/20 to-orange-500/20",
    darkGradient: "dark:from-amber-500/10 dark:to-orange-500/10",
    iconColor: "text-tertiary dark:text-tertiary-fixed-dim",
  },
];

/* ─── Pipeline Steps ─── */
const steps = [
  {
    num: "01",
    label: "STAGE",
    title: "Sync Artifacts",
    description: "Upload resume PDF and connect your GitHub profile in one click.",
    highlighted: false,
  },
  {
    num: "02",
    label: "BUILD",
    title: "AI Deep Scan",
    description: "Our LLM-powered engine runs 40+ career-specific heuristics across your data.",
    highlighted: false,
  },
  {
    num: "03",
    label: "DEPLOY",
    title: "Optimize & Hire",
    description: "Receive a prioritized roadmap of improvements to maximize your interview conversion rate.",
    highlighted: true,
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Stat counters
  const stat1 = useAnimatedCounter(5000);
  const stat2 = useAnimatedCounter(98);
  const stat3 = useAnimatedCounter(40);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDemo(!!window.localStorage.getItem("demo_token"));
    }
  }, []);

  const handleDemoMode = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("demo_token", "demo-token");
      // Call session sync endpoint to ensure demo user is seeded
      try {
        await fetch("http://localhost:4000/api/auth/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer demo-token",
          },
        });
      } catch (e) {
        console.error("Failed to sync demo user profile:", e);
      }
      router.push("/dashboard");
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
              <Link className="text-primary dark:text-primary-fixed-dim font-semibold border-b-2 border-primary pb-1 font-body-base text-body-base" href="/">Product</Link>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="/#features">Features</a>
              <Link className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="/pricing">Pricing</Link>
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

      <main className="pt-16 grow">
        {/* ─── Hero Section ─── */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop py-24">
          <ShaderBackground theme={theme} />
          
          {/* Floating Orbs */}
          <div className="floating-orb floating-orb-1" style={{ width: 350, height: 350, top: '5%', left: '3%', background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }} />
          <div className="floating-orb floating-orb-2" style={{ width: 300, height: 300, top: '55%', right: '2%', background: 'radial-gradient(circle, rgba(244,63,94,0.4), transparent)' }} />
          <div className="floating-orb floating-orb-3" style={{ width: 280, height: 280, bottom: '10%', left: '12%', background: 'radial-gradient(circle, rgba(6,182,212,0.4), transparent)' }} />
          <div className="floating-orb floating-orb-4" style={{ width: 250, height: 250, top: '15%', right: '18%', background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)' }} />
          <div className="floating-orb floating-orb-5" style={{ width: 200, height: 200, top: '40%', left: '38%', background: 'radial-gradient(circle, rgba(245,158,11,0.3), transparent)' }} />

          <motion.div 
            className="relative z-10 text-center max-w-4xl mx-auto space-y-8 px-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <div className="shimmer-badge inline-flex items-center gap-2 bg-primary/15 text-primary dark:text-primary-fixed-dim border border-primary/40 dark:border-primary/30 px-5 py-2 rounded-full mb-4">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="font-label-caps tracking-widest text-xs font-semibold">AI-DRIVEN CAREER ENGINE</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={fadeUp}
              className="font-display-lg text-5xl md:text-[72px] leading-tight text-on-surface dark:text-white font-bold tracking-tight"
            >
              Stop guessing.<br/>
              <span className="text-primary dark:text-primary-fixed-dim">Start getting hired.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={fadeUp}
              className="font-body-base text-lg md:text-xl text-on-surface-variant dark:text-surface-variant max-w-2xl mx-auto leading-relaxed"
            >
              PortfolioIQ analyzes your resume, GitHub, and target role — then tells you exactly what to optimize to beat the technical recruiters' filters.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <motion.button 
                onClick={() => router.push(session || isDemo ? "/dashboard" : "/login")}
                className="btn-glow bg-primary text-on-primary px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 cursor-pointer"
                whileHover={{ scale: 1.04, boxShadow: "0 20px 50px -10px rgba(68,80,183,0.4)" }}
                whileTap={{ scale: 0.97 }}
              >
                Analyze My Profile
                <motion.span 
                  className="material-symbols-outlined"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  arrow_forward
                </motion.span>
              </motion.button>
              <motion.button 
                onClick={handleDemoMode}
                className="bg-transparent border border-outline-variant dark:border-outline text-on-surface-variant dark:text-surface-variant px-8 py-4 rounded-xl font-semibold text-lg hover:bg-surface-container-highest/10 transition-primary cursor-pointer"
                whileHover={{ scale: 1.04, borderColor: "rgba(68,80,183,0.5)" }}
                whileTap={{ scale: 0.97 }}
              >
                Recruiter Quick Demo
              </motion.button>
            </motion.div>

            {/* Stat Counters */}
            <motion.div 
              variants={fadeUp}
              className="flex flex-wrap justify-center gap-8 md:gap-12 pt-6"
            >
              <div className="text-center">
                <span ref={stat1.ref} className="stat-value text-3xl md:text-4xl font-bold font-display-lg">{stat1.count.toLocaleString()}+</span>
                <p className="text-xs text-on-surface-variant dark:text-surface-variant mt-1 font-body-sm">Profiles Analyzed</p>
              </div>
              <div className="text-center">
                <span ref={stat2.ref} className="stat-value text-3xl md:text-4xl font-bold font-display-lg">{stat2.count}%</span>
                <p className="text-xs text-on-surface-variant dark:text-surface-variant mt-1 font-body-sm">Match Accuracy</p>
              </div>
              <div className="text-center">
                <span ref={stat3.ref} className="stat-value text-3xl md:text-4xl font-bold font-display-lg">{stat3.count}+</span>
                <p className="text-xs text-on-surface-variant dark:text-surface-variant mt-1 font-body-sm">AI Heuristics</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Scrolling Marquee Tech Badges ─── */}
        <section className="bg-surface dark:bg-surface-dark border-y border-outline-variant/30 dark:border-border-subtle py-6 overflow-hidden transition-colors duration-200">
          <div className="relative w-full overflow-hidden">
            <div className="marquee-track flex flex-row w-max gap-6">
              {[...techBadges, ...techBadges].map((badge, i) => (
                <div 
                  key={i} 
                  className="shrink-0 flex items-center gap-3 px-6 py-3 mx-3 rounded-full glass-panel border border-outline-variant/20 dark:border-border-subtle hover:border-primary/30 dark:hover:border-primary-fixed-dim/20 transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim text-2xl">{badge.icon}</span>
                  <span className="font-display-lg text-sm font-semibold text-on-surface dark:text-white whitespace-nowrap">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features Section ─── */}
        <section id="features" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <motion.div 
            className="text-center mb-16 space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="font-display-lg text-3xl md:text-5xl font-bold text-on-surface dark:text-white">
              Engineering Perfection
            </motion.h2>
            <motion.p variants={fadeUp} className="text-on-surface-variant dark:text-surface-variant max-w-xl mx-auto">
              Our multi-modal engine dissects your entire professional presence through the eyes of top-tier engineering managers.
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={fadeUpSpring}
                className="group glass-card p-8 rounded-2xl relative overflow-hidden"
              >
                {/* Glow accent behind icon */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-linear-to-br ${feature.gradient} ${feature.darkGradient} rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${feature.gradient} ${feature.darkGradient} flex items-center justify-center mb-6`}>
                    <span className={`material-symbols-outlined ${feature.iconColor} icon-glow text-2xl`}>{feature.icon}</span>
                  </div>
                  <h3 className="font-display-lg text-2xl mb-4 font-semibold text-on-surface dark:text-white">{feature.title}</h3>
                  <p className="font-body-base text-on-surface-variant dark:text-surface-variant leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ─── How It Works Section ─── */}
        <section className="py-24 bg-surface-container-low dark:bg-[#0a0d12] overflow-hidden transition-colors duration-200">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <motion.h2 
              className="font-display-lg text-3xl md:text-5xl font-bold text-center text-on-surface dark:text-white mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              The Deployment Pipeline
            </motion.h2>

            <motion.div 
              className="relative flex flex-col md:flex-row gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {/* Animated Connector Line */}
              <div className="absolute top-1/2 left-0 w-full h-px hidden md:block z-0 overflow-hidden">
                <motion.div 
                  className="h-full bg-linear-to-r from-primary/40 via-primary to-primary/40 dark:from-primary-fixed-dim/30 dark:via-primary-fixed-dim/60 dark:to-primary-fixed-dim/30"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  style={{ transformOrigin: "left" }}
                />
              </div>

              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUpSpring}
                  className={`relative z-10 flex-1 p-8 rounded-2xl transition-all duration-200 ${
                    step.highlighted 
                      ? "bg-primary text-white shadow-2xl shadow-primary/20" 
                      : "glass-card bg-surface dark:bg-surface-dark"
                  }`}
                  whileHover={!step.highlighted ? { y: -6 } : {}}
                >
                  {step.highlighted ? (
                    <>
                      <div className="dot-grid absolute inset-0 rounded-2xl opacity-30" />
                      <div className="relative z-10">
                        <span className="text-5xl font-bold text-white/25 font-display-lg block mb-2">{step.num}</span>
                        <span className="font-code-sm text-white/60 mb-4 block text-xs tracking-widest">{step.label}</span>
                        <h4 className="font-display-lg text-xl mb-3 font-semibold text-white">{step.title}</h4>
                        <p className="font-body-base text-white/90">{step.description}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="step-number text-5xl font-bold font-display-lg block mb-2">{step.num}</span>
                      <span className="font-code-sm text-primary dark:text-primary-fixed-dim mb-4 block text-xs tracking-widest">{step.label}</span>
                      <h4 className="font-display-lg text-xl mb-3 font-semibold text-on-surface dark:text-white">{step.title}</h4>
                      <p className="font-body-base text-on-surface-variant dark:text-surface-variant">{step.description}</p>
                    </>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Before/After Preview ─── */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeUp} className="font-display-lg text-3xl md:text-5xl font-bold text-on-surface dark:text-white mb-4">Impact Proof</motion.h2>
            <motion.p variants={fadeUp} className="text-on-surface-variant dark:text-surface-variant">Experience the transformation from "Rejected" to "Scheduled."</motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-[1fr_4px_1fr] gap-0 rounded-2xl overflow-hidden border border-outline-variant/30 dark:border-border-subtle shadow-xl shadow-black/5 dark:shadow-black/20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {/* Before */}
            <motion.div 
              variants={fadeUp}
              className="bg-surface-container-lowest dark:bg-[#0c0f14] p-8 md:p-12 transition-colors duration-200 relative overflow-hidden"
            >
              {/* Red tinted overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-red-500/3 to-transparent dark:from-red-500/5" />
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-error/15 text-error rounded-full text-xs font-bold mb-6 tracking-widest uppercase">Before PortfolioIQ</div>
                <div className="space-y-6 opacity-60">
                  <div className="h-6 bg-surface-variant/20 rounded w-3/4"></div>
                  <motion.ul 
                    className="space-y-4"
                    variants={staggerContainer}
                  >
                    {[
                      "Worked on a React application for client management.",
                      "Fixed bugs and improved performance of the dashboard.",
                      "Collaborated with team members using Git and Slack.",
                    ].map((text, i) => (
                      <motion.li 
                        key={i} 
                        variants={fadeUp}
                        className="flex items-start gap-3"
                      >
                        <span className="material-symbols-outlined text-error mt-0.5">close</span>
                        <span className="font-body-base text-on-surface-variant dark:text-surface-variant">{text}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            </motion.div>

            {/* Animated Divider */}
            <div className="hidden md:block gradient-divider" />

            {/* After */}
            <motion.div 
              variants={fadeUp}
              className="bg-surface-container-lowest dark:bg-[#0c0f14] p-8 md:p-12 relative overflow-hidden transition-colors duration-200"
            >
              {/* Green/primary tinted overlay */}
              <div className="absolute inset-0 bg-linear-to-br from-primary/3 to-transparent dark:from-primary/5" />
              <div className="absolute top-0 right-0 p-8">
                <motion.span 
                  className="material-symbols-outlined text-secondary-fixed-dim text-6xl opacity-20"
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                >
                  verified_user
                </motion.span>
              </div>
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary dark:text-primary-fixed-dim rounded-full text-xs font-bold mb-6 tracking-widest uppercase">After AI Optimization</div>
                <div className="space-y-6">
                  <div className="h-6 bg-primary/10 rounded w-1/2"></div>
                  <motion.ul 
                    className="space-y-4"
                    variants={staggerContainer}
                  >
                    {[
                      "Architected a scalable React/Redux CRM, reducing page load times by 40% for 5,000+ daily active users.",
                      "Optimized Postgres query performance by 22% through strategic indexing and schema normalization.",
                      "Pioneered a CI/CD pipeline using GitHub Actions, reducing deployment errors by 15% across 4 microservices.",
                    ].map((text, i) => (
                      <motion.li 
                        key={i} 
                        variants={scaleIn}
                        className="flex items-start gap-3"
                      >
                        <motion.span 
                          className="material-symbols-outlined text-secondary-fixed-dim mt-0.5"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 + i * 0.15 }}
                        >
                          check_circle
                        </motion.span>
                        <span className="font-body-base font-medium text-on-surface dark:text-white">{text}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                  <div className="mt-8 pt-6 border-t border-outline-variant/30 dark:border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <motion.span 
                        className="material-symbols-outlined text-secondary-fixed-dim text-[16px]" 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        animate={{ rotate: [0, 20, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        star
                      </motion.span>
                      <span className="font-label-caps text-secondary-fixed-dim font-bold">MATCH SCORE: 98%</span>
                    </div>
                    <span className="font-code-sm text-on-surface-variant dark:text-surface-variant text-xs">Recommended for: Senior Frontend Engineer</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop">
          <motion.div 
            className="max-w-4xl mx-auto rounded-3xl bg-primary relative overflow-hidden p-6 sm:p-10 md:p-14 text-center text-on-primary shadow-2xl shadow-primary/20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            {/* Dot grid overlay */}
            <div className="dot-grid absolute inset-0 opacity-20" />
            
            {/* Decorative glow orbs */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-violet-400/15 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-6">
              <motion.h2 
                className="font-display-lg text-4xl md:text-5xl font-bold mb-6 text-white"
                variants={fadeUp}
              >
                Ready to upgrade your career?
              </motion.h2>
              <motion.p 
                className="text-xl text-white/80 max-w-xl mx-auto"
                variants={fadeUp}
              >
                Join 5,000+ developers who optimized their profile and landed interviews using PortfolioIQ.
              </motion.p>
              <motion.button 
                onClick={() => router.push(session || isDemo ? "/dashboard" : "/login")}
                className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-xl shadow-2xl cursor-pointer"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 60px -12px rgba(0,0,0,0.25)" }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started For Free
              </motion.button>
              <p className="mt-6 font-code-sm text-white/60 text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                No credit card required. Connect GitHub to begin.
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-surface dark:bg-surface-dark border-t-0 relative">
        {/* Gradient top border */}
        <div className="h-px w-full bg-linear-to-r from-transparent via-primary/30 dark:via-primary-fixed-dim/20 to-transparent" />
        
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-14 flex flex-col md:flex-row justify-between gap-10">
          <div className="space-y-4 max-w-xs">
            <span className="font-display-lg text-headline-md text-primary dark:text-primary-fixed-dim font-bold">PortfolioIQ</span>
            <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-sm leading-relaxed">The AI career engine for professional software developers. Built for precision, performance, and results.</p>
            <div className="text-on-surface-variant dark:text-surface-variant font-body-sm font-semibold text-xs">
              Built by Rohan Prasad
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h5 className="font-label-caps text-on-surface dark:text-white font-bold text-xs uppercase tracking-wider">Product</h5>
              <ul className="space-y-3 font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/#features">Features</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Integrations</a></li>
                <li><Link className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-label-caps text-on-surface dark:text-white font-bold text-xs uppercase tracking-wider">Legal</h5>
              <ul className="space-y-3 font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Terms of Service</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-label-caps text-on-surface dark:text-white font-bold text-xs uppercase tracking-wider">Social</h5>
              <ul className="space-y-3 font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Twitter</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">LinkedIn</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 border-t border-outline-variant/15 dark:border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-body-sm text-on-surface-variant dark:text-surface-variant text-xs opacity-60">© 2024 PortfolioIQ AI. Built for developers.</span>
          <div className="flex gap-4 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/30"></span>
            <span className="font-code-sm text-on-surface-variant dark:text-surface-variant text-[10px] tracking-widest uppercase">System Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

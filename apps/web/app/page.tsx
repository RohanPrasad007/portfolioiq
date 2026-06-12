"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "./providers";

function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord;
        float noise = sin(uv.x * 10.0 + u_time) * cos(uv.y * 10.0 + u_time * 0.5);
        noise += sin(uv.x * 20.0 - u_time * 0.7) * cos(uv.y * 15.0 + u_time);
        
        vec3 color1 = vec3(0.18, 0.22, 0.54); // Indigo brand color (#2e3aa2 / #4450b7)
        vec3 color2 = vec3(0.03, 0.03, 0.06); // Deep Navy (#08090A)
        
        vec3 finalColor = mix(color2, color1, noise * 0.12 + 0.12);
        float dist = distance(uv, vec2(0.5));
        finalColor *= 1.0 - dist * 0.6;

        gl_FragColor = vec4(finalColor, 1.0);
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
    <div className="absolute inset-0 w-full h-full z-0 opacity-80 pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
            <span className="font-display-lg text-headline-md tracking-tight text-primary dark:text-primary-fixed-dim">PortfolioIQ</span>
            <div className="hidden md:flex gap-6">
              <a className="text-primary dark:text-primary-fixed-dim font-semibold border-b-2 border-primary pb-1 font-body-base text-body-base" href="#">Product</a>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="#">Features</a>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="#">Pricing</a>
              <a className="text-on-surface-variant dark:text-surface-variant hover:text-primary transition-colors font-body-base text-body-base" href="#">Docs</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-variant/20 dark:hover:bg-surface-container-highest/10 transition-primary cursor-pointer flex items-center justify-center text-on-surface-variant dark:text-surface-variant"
              title="Toggle Theme"
            >
              <span className="material-symbols-outlined">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>
            {session || isDemo ? (
              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body-base text-body-base font-semibold hover:opacity-90 active:scale-[0.98] transition-primary cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <button 
                onClick={() => router.push("/login")}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body-base text-body-base font-semibold hover:opacity-90 active:scale-[0.98] transition-primary cursor-pointer"
              >
                Connect GitHub
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16 flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop py-24">
          <ShaderBackground />
          <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8 px-4">
            <div className="inline-flex items-center gap-2 bg-primary/15 text-primary-fixed-dim border border-primary/30 px-4 py-1.5 rounded-full mb-4">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-label-caps tracking-widest text-xs font-semibold">AI-DRIVEN CAREER ENGINE</span>
            </div>
            <h1 className="font-display-lg text-5xl md:text-[72px] leading-tight text-on-surface dark:text-white font-bold tracking-tight">
              Stop guessing.<br/>
              <span className="text-primary dark:text-primary-fixed-dim">Start getting hired.</span>
            </h1>
            <p className="font-body-base text-lg md:text-xl text-on-surface-variant dark:text-surface-variant max-w-2xl mx-auto leading-relaxed">
              PortfolioIQ analyzes your resume, GitHub, and target role — then tells you exactly what to optimize to beat the technical recruiters' filters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => router.push(session || isDemo ? "/dashboard" : "/login")}
                className="bg-primary text-on-primary px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-primary cursor-pointer"
              >
                Analyze My Profile
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button 
                onClick={handleDemoMode}
                className="bg-transparent border border-outline text-surface-variant px-8 py-4 rounded-lg font-semibold text-lg hover:bg-surface-container-highest/10 transition-primary cursor-pointer"
              >
                Recruiter Quick Demo
              </button>
            </div>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="bg-surface dark:bg-surface-dark border-y border-border-subtle dark:border-border-subtle py-8 transition-colors duration-200">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl">terminal</span>
              <span className="font-display-lg text-xl font-bold">GitHub Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
              <span className="font-display-lg text-xl font-bold">PDF Parsing</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl">psychology</span>
              <span className="font-display-lg text-xl font-bold">Google Gemini</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display-lg text-3xl md:text-5xl font-bold text-on-surface dark:text-white">Engineering Perfection</h2>
            <p className="text-on-surface-variant dark:text-surface-variant max-w-xl mx-auto">Our multi-modal engine dissects your entire professional presence through the eyes of top-tier engineering managers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-xl bg-surface-container-lowest dark:bg-[#0e1217] border border-border-subtle dark:border-border-subtle hover:border-primary/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim">description</span>
              </div>
              <h3 className="font-display-lg text-2xl mb-4 font-semibold text-on-surface dark:text-white">Resume Intelligence</h3>
              <p className="font-body-base text-on-surface-variant dark:text-surface-variant leading-relaxed">Deep semantic analysis of your experience. We identify missing keywords and weak bullet points that AI screeners ignore.</p>
            </div>
            {/* Feature 2 */}
            <div className="group p-8 rounded-xl bg-surface-container-lowest dark:bg-[#0e1217] border border-border-subtle dark:border-border-subtle hover:border-primary/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-secondary-fixed-dim/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim">code</span>
              </div>
              <h3 className="font-display-lg text-2xl mb-4 font-semibold text-on-surface dark:text-white">GitHub Code Audit</h3>
              <p className="font-body-base text-on-surface-variant dark:text-surface-variant leading-relaxed">We scan your repositories for documentation quality, commit frequency, and technical complexity to prove you can ship production code.</p>
            </div>
            {/* Feature 3 */}
            <div className="group p-8 rounded-xl bg-surface-container-lowest dark:bg-[#0e1217] border border-border-subtle dark:border-border-subtle hover:border-primary/50 transition-all duration-200">
              <div className="w-12 h-12 rounded-lg bg-tertiary-fixed/15 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-tertiary dark:text-tertiary-fixed-dim">analytics</span>
              </div>
              <h3 className="font-display-lg text-2xl mb-4 font-semibold text-on-surface dark:text-white">Job Match Scoring</h3>
              <p className="font-body-base text-on-surface-variant dark:text-surface-variant leading-relaxed">Instant compatibility rating for specific job descriptions. See exactly where your skills gap exists for your dream role.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-surface-container-low dark:bg-[#0a0d12] overflow-hidden transition-colors duration-200">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <h2 className="font-display-lg text-3xl md:text-5xl font-bold text-center text-on-surface dark:text-white mb-20">The Deployment Pipeline</h2>
            <div className="relative flex flex-col md:flex-row gap-12">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-subtle dark:bg-border-subtle hidden md:block z-0"></div>
              {/* Step 1 */}
              <div className="relative z-10 flex-1 bg-surface dark:bg-surface-dark p-8 rounded-xl border border-border-subtle dark:border-border-subtle shadow-sm transition-all duration-200">
                <span className="font-code-sm text-primary dark:text-primary-fixed-dim mb-4 block">01 / STAGE</span>
                <h4 className="font-display-lg text-xl mb-3 font-semibold text-on-surface dark:text-white">Sync Artifacts</h4>
                <p className="font-body-base text-on-surface-variant dark:text-surface-variant">Upload resume PDF and connect your GitHub profile in one click.</p>
              </div>
              {/* Step 2 */}
              <div className="relative z-10 flex-1 bg-surface dark:bg-surface-dark p-8 rounded-xl border border-border-subtle dark:border-border-subtle shadow-sm transition-all duration-200">
                <span className="font-code-sm text-primary dark:text-primary-fixed-dim mb-4 block">02 / BUILD</span>
                <h4 className="font-display-lg text-xl mb-3 font-semibold text-on-surface dark:text-white">AI Deep Scan</h4>
                <p className="font-body-base text-on-surface-variant dark:text-surface-variant">Our LLM-powered engine runs 40+ career-specific heuristics across your data.</p>
              </div>
              {/* Step 3 */}
              <div className="relative z-10 flex-1 bg-primary text-on-primary p-8 rounded-xl shadow-xl">
                <span className="font-code-sm text-on-primary/70 mb-4 block">03 / DEPLOY</span>
                <h4 className="font-display-lg text-xl mb-3 font-semibold text-white">Optimize &amp; Hire</h4>
                <p className="font-body-base text-white/95">Receive a prioritized roadmap of improvements to maximize your interview conversion rate.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Preview */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-3xl font-bold text-on-surface dark:text-white mb-4">Impact Proof</h2>
            <p className="text-on-surface-variant dark:text-surface-variant">Experience the transformation from "Rejected" to "Scheduled."</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-border-subtle rounded-2xl overflow-hidden border border-border-subtle dark:border-border-subtle">
            {/* Before */}
            <div className="bg-surface-container-lowest dark:bg-[#0c0f14] p-8 md:p-12 transition-colors duration-200">
              <div className="inline-block px-3 py-1 bg-error/15 text-error rounded-full text-xs font-bold mb-6 tracking-widest uppercase">Before PortfolioIQ</div>
              <div className="space-y-6 opacity-60">
                <div className="h-6 bg-surface-variant/20 rounded w-3/4"></div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-error mt-0.5">close</span>
                    <span className="font-body-base text-on-surface-variant dark:text-surface-variant">Worked on a React application for client management.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-error mt-0.5">close</span>
                    <span className="font-body-base text-on-surface-variant dark:text-surface-variant">Fixed bugs and improved performance of the dashboard.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-error mt-0.5">close</span>
                    <span className="font-body-base text-on-surface-variant dark:text-surface-variant">Collaborated with team members using Git and Slack.</span>
                  </li>
                </ul>
              </div>
            </div>
            {/* After */}
            <div className="bg-surface-container-lowest dark:bg-[#0c0f14] p-8 md:p-12 relative overflow-hidden transition-colors duration-200">
              <div className="absolute top-0 right-0 p-8">
                <span className="material-symbols-outlined text-secondary-fixed-dim text-6xl opacity-20">verified_user</span>
              </div>
              <div className="inline-block px-3 py-1 bg-primary/10 text-primary dark:text-primary-fixed-dim rounded-full text-xs font-bold mb-6 tracking-widest uppercase">After AI Optimization</div>
              <div className="space-y-6">
                <div className="h-6 bg-primary/10 rounded w-1/2"></div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim mt-0.5">check_circle</span>
                    <span className="font-body-base font-medium text-on-surface dark:text-white">Architected a scalable React/Redux CRM, reducing page load times by 40% for 5,000+ daily active users.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim mt-0.5">check_circle</span>
                    <span className="font-body-base font-medium text-on-surface dark:text-white">Optimized Postgres query performance by 22% through strategic indexing and schema normalization.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed-dim mt-0.5">check_circle</span>
                    <span className="font-body-base font-medium text-on-surface dark:text-white">Pioneered a CI/CD pipeline using GitHub Actions, reducing deployment errors by 15% across 4 microservices.</span>
                  </li>
                </ul>
                <div className="mt-8 pt-6 border-t border-border-subtle dark:border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-fixed-dim text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label-caps text-secondary-fixed-dim font-bold">MATCH SCORE: 98%</span>
                  </div>
                  <span className="font-code-sm text-on-surface-variant dark:text-surface-variant text-xs">Recommended for: Senior Frontend Engineer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop">
          <div className="max-w-4xl mx-auto rounded-3xl bg-primary relative overflow-hidden p-6 sm:p-10 md:p-12 text-center text-on-primary shadow-2xl">
            <div className="relative z-10 space-y-6">
              <h2 className="font-display-lg text-4xl md:text-5xl font-bold mb-6 text-white">Ready to upgrade your career?</h2>
              <p className="text-xl text-white/80 max-w-xl mx-auto">Join 5,000+ developers who optimized their profile and landed interviews using PortfolioIQ.</p>
              <button 
                onClick={() => router.push(session || isDemo ? "/dashboard" : "/login")}
                className="bg-white text-primary px-10 py-5 rounded-xl font-bold text-xl hover:bg-opacity-90 active:scale-[0.98] transition-primary shadow-2xl cursor-pointer"
              >
                Get Started For Free
              </button>
              <p className="mt-6 font-code-sm text-white/60 text-xs">No credit card required. Connect GitHub to begin.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface dark:bg-surface-dark border-t border-border-subtle dark:border-border-subtle">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col md:flex-row justify-between gap-8">
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
              <ul className="space-y-2 font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Integrations</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Pricing</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-label-caps text-on-surface dark:text-white font-bold text-xs uppercase tracking-wider">Legal</h5>
              <ul className="space-y-2 font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Terms of Service</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-label-caps text-on-surface dark:text-white font-bold text-xs uppercase tracking-wider">Social</h5>
              <ul className="space-y-2 font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">Twitter</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">LinkedIn</a></li>
                <li><a className="hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 border-t border-border-subtle dark:border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-body-sm text-on-surface-variant dark:text-surface-variant text-xs opacity-60">© 2024 PortfolioIQ AI. Built for developers.</span>
          <div className="flex gap-4 items-center">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
            <span className="font-code-sm text-on-surface-variant dark:text-surface-variant text-[10px] tracking-widest uppercase">System Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

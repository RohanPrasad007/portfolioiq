"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleGithubLogin = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

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
    <div className="bg-surface dark:bg-surface-dark min-h-screen flex items-center justify-center px-4 relative overflow-hidden font-body-base transition-colors duration-200">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-fixed-dim/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-2xl relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display-lg text-3xl font-bold tracking-tight text-on-surface dark:text-white mb-2 cursor-pointer" onClick={() => router.push("/")}>
            PortfolioIQ
          </h1>
          <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-sm">
            AI-powered Developer Career Engine
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-headline-md text-xl text-on-surface dark:text-white font-semibold text-center">
              Welcome to the platform
            </h3>
            <p className="text-on-surface-variant dark:text-surface-variant text-center text-xs">
              Connect your account to analyze your code repositories and resume.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleGithubLogin}
              className="w-full py-3.5 px-4 bg-[#24292e] text-white font-semibold rounded-lg flex items-center justify-center gap-3 hover:bg-[#1a1e22] active:scale-[0.98] transition-primary cursor-pointer border border-border-subtle"
            >
              {/* GitHub Logo */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.414-4.041-1.414-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign In with GitHub
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-border-subtle dark:border-border-subtle"></div>
              <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-on-surface-variant dark:text-surface-variant">Or</span>
              <div className="flex-grow border-t border-border-subtle dark:border-border-subtle"></div>
            </div>

            <button
              onClick={handleDemoMode}
              className="w-full py-3.5 px-4 bg-primary text-on-primary font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-primary cursor-pointer shadow-lg shadow-primary/10"
            >
              <span className="material-symbols-outlined text-lg">science</span>
              Recruiter Quick Demo
            </button>
          </div>
        </div>

        <div className="mt-8 text-center border-t border-border-subtle dark:border-border-subtle pt-6">
          <p className="text-on-surface-variant dark:text-surface-variant text-xs flex justify-center items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim animate-pulse"></span>
            Operational demo mode includes seeded profile insights.
          </p>
        </div>
      </div>
    </div>
  );
}

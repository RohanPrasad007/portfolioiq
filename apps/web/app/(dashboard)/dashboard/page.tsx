"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api-client";
import { IInsight } from "@portfolioiq/shared";
import { useProfileStore } from "@/lib/profile-store";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<IInsight[]>([]);
  const { profile: githubData, fetchProfile } = useProfileStore();
  const [loading, setLoading] = useState(true);

  // Compute metrics
  const totalAnalyses = history.length;
  const avgMatchScore = history.length > 0 
    ? Math.round(history.reduce((sum, item) => sum + (item.analysis?.matchRate || 0), 0) / history.length) 
    : 0;
  const keywordsAdded = history.reduce((sum, item) => sum + (item.analysis?.foundKeywords?.length || 0), 0);

  useEffect(() => {
    if (status === "loading") return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch analyses history
        const historyRes = await apiClient.get("/api/analysis/history?limit=10");
        if (historyRes.data && historyRes.data.success) {
          setHistory(historyRes.data.data.insights || []);
        }

        // Fetch profile using cached store
        const token = session ? (session as any).accessToken : (typeof window !== "undefined" && window.localStorage.getItem("demo_token") || "");
        if (token) {
          await fetchProfile(token);
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status, (session as any)?.accessToken, fetchProfile]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-secondary/15 text-secondary dark:text-secondary-fixed-dim";
      case "processing":
        return "bg-primary/15 text-primary dark:text-primary-fixed-dim animate-pulse";
      case "failed":
        return "bg-error/15 text-error";
      default:
        return "bg-surface-variant/20 text-on-surface-variant dark:text-surface-variant";
    }
  };

  const handleRowClick = (item: IInsight) => {
    if (item.status === "completed") {
      router.push(`/analysis/${item._id}/results`);
    } else if (item.status === "failed") {
      router.push(`/analysis/${item._id}/progress`);
    } else {
      router.push(`/analysis/${item._id}/progress`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-gutter max-w-container-max mx-auto p-4">
        {/* Skeleton grid */}
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-4 h-48 rounded-xl glass-panel skeleton-shimmer"></div>
          <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-gutter">
            <div className="h-20 rounded-xl glass-panel skeleton-shimmer"></div>
            <div className="h-20 rounded-xl glass-panel skeleton-shimmer"></div>
            <div className="h-20 rounded-xl glass-panel skeleton-shimmer"></div>
            <div className="h-20 rounded-xl glass-panel skeleton-shimmer"></div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 xl:col-span-8 h-80 rounded-xl glass-panel skeleton-shimmer"></div>
          <div className="col-span-12 xl:col-span-4 h-80 rounded-xl glass-panel skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-gutter max-w-container-max mx-auto px-1 md:px-0">
      
      {/* Quick Actions & Bento Stats */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Action Card */}
        <div className="col-span-12 lg:col-span-4 glass-panel p-6 rounded-xl flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
          <div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary dark:text-primary-fixed-dim mb-4 flex-shrink-0">
              <span className="material-symbols-outlined">rocket_launch</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface dark:text-white mb-2">New Analysis</h3>
            <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-sm leading-relaxed">
              Upload your latest resume and paste a job description for an instant AI alignment score.
            </p>
          </div>
          <button 
            onClick={() => router.push("/analysis/new")}
            className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            Analyze New Resume
          </button>
        </div>

        {/* Stats Row */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed-dim/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <p className="text-[11px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">TOTAL ANALYSES RUN</p>
              <h4 className="text-2xl font-bold text-primary dark:text-primary-fixed-dim">{totalAnalyses}</h4>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <div>
              <p className="text-[11px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">AVERAGE MATCH SCORE</p>
              <h4 className="text-2xl font-bold text-primary dark:text-primary-fixed-dim">{avgMatchScore}%</h4>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-fixed/15 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">key</span>
            </div>
            <div>
              <p className="text-[11px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">KEYWORDS DETECTED</p>
              <h4 className="text-2xl font-bold text-primary dark:text-primary-fixed-dim">{keywordsAdded}</h4>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-variant/10 flex items-center justify-center text-on-surface-variant dark:text-surface-variant">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-[11px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">LAST ACTIVE</p>
              <h4 className="text-2xl font-bold text-primary dark:text-primary-fixed-dim">
                {history.length > 0 ? "Today" : "N/A"}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Recent Analyses Table */}
        <div className="col-span-12 xl:col-span-8 glass-panel rounded-xl overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-black/10 dark:border-border-subtle bg-surface-variant/10 dark:bg-[#0c1016]">
            <h3 className="font-headline-md text-lg text-on-surface dark:text-white font-semibold">Recent Analyses</h3>
          </div>
          <div className="overflow-x-auto">
            {history.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <table className="w-full text-left font-body-sm hidden md:table">
                  <thead>
                    <tr className="bg-surface-variant/5 text-on-surface-variant dark:text-surface-variant text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Filename</th>
                      <th className="px-6 py-3 font-semibold">Job Title</th>
                      <th className="px-6 py-3 font-semibold text-center">Match %</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-border-subtle">
                    {history.map((item) => (
                      <tr 
                        key={item._id}
                        onClick={() => handleRowClick(item)}
                        className="hover:bg-surface-variant/5 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 font-code-sm text-primary dark:text-primary-fixed-dim font-medium">
                          {(item.resumeId as any)?.fileName || "resume.pdf"}
                        </td>
                        <td className="px-6 py-4 text-on-surface dark:text-white">
                          {item.targetJobTitle}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-12 relative flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle className="text-surface-variant/10" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="2.5"></circle>
                                <circle 
                                  className="text-secondary-fixed-dim" 
                                  cx="24" 
                                  cy="24" 
                                  fill="transparent" 
                                  r="20" 
                                  stroke="currentColor" 
                                  strokeDasharray="125.6" 
                                  strokeDashoffset={125.6 - (125.6 * (item.analysis?.matchRate || 0)) / 100} 
                                  strokeWidth="2.5"
                                ></circle>
                              </svg>
                              <span className="absolute text-[11px] font-bold text-on-surface dark:text-white">
                                {item.analysis?.matchRate ? `${item.analysis.matchRate}%` : "—"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant dark:text-surface-variant">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          }) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="block md:hidden divide-y divide-black/10 dark:divide-border-subtle">
                  {history.map((item) => (
                    <div 
                      key={item._id}
                      onClick={() => handleRowClick(item)}
                      className="p-4 hover:bg-surface-variant/5 transition-colors cursor-pointer flex justify-between items-center gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <p className="font-code-sm text-primary dark:text-primary-fixed-dim font-medium truncate text-xs">
                          {(item.resumeId as any)?.fileName || "resume.pdf"}
                        </p>
                        <h4 className="text-on-surface dark:text-white font-medium text-sm truncate">
                          {item.targetJobTitle}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="text-on-surface-variant dark:text-surface-variant">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric"
                            }) : ""}
                          </span>
                        </div>
                      </div>
                      
                      {/* Match score on the right */}
                      <div className="flex-shrink-0 w-12 h-12 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-surface-variant/10" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="2.5"></circle>
                          <circle 
                            className="text-secondary-fixed-dim" 
                            cx="24" 
                            cy="24" 
                            fill="transparent" 
                            r="20" 
                            stroke="currentColor" 
                            strokeDasharray="125.6" 
                            strokeDashoffset={125.6 - (125.6 * (item.analysis?.matchRate || 0)) / 100} 
                            strokeWidth="2.5"
                          ></circle>
                        </svg>
                        <span className="absolute text-[11px] font-bold text-on-surface dark:text-white">
                          {item.analysis?.matchRate ? `${item.analysis.matchRate}%` : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant dark:text-surface-variant">description</span>
                <p className="text-on-surface-variant dark:text-surface-variant text-sm">No resume analyses run yet. Upload a resume to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* GitHub Card & Insights */}
        <div className="col-span-12 xl:col-span-4 space-y-gutter">
          {githubData ? (
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-4 right-4">
                <svg className="w-6 h-6 text-on-surface-variant dark:text-surface-variant" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.414-4.041-1.414-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <img 
                  alt="GitHub Avatar" 
                  className="w-14 h-14 rounded-full border-2 border-primary ring-4 ring-primary/10" 
                  src={githubData.avatarUrl} 
                />
                <div>
                  <h4 className="font-headline-md text-lg leading-tight text-on-surface dark:text-white font-semibold">{githubData.username}</h4>
                  <p className="font-body-sm text-on-surface-variant dark:text-surface-variant flex items-center gap-1 text-xs">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {githubData.location}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-variant/5 p-3 rounded-lg border border-black/10 dark:border-border-subtle">
                  <p className="text-[10px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">PUBLIC REPOS</p>
                  <p className="text-xl font-bold text-primary dark:text-primary-fixed-dim">{githubData.publicRepos}</p>
                </div>
                <div className="bg-surface-variant/5 p-3 rounded-lg border border-black/10 dark:border-border-subtle">
                  <p className="text-[10px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">TOTAL STARS</p>
                  <p className="text-xl font-bold text-primary dark:text-primary-fixed-dim">{githubData.totalStars}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-label-caps text-on-surface-variant dark:text-surface-variant tracking-wider font-semibold">TOP LANGUAGES</p>
                <div className="space-y-2.5">
                  {githubData.topLanguages.map((lang, index) => {
                    const colors = ["bg-primary", "bg-secondary-fixed-dim", "bg-tertiary-container"];
                    return (
                      <div key={lang.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-body-sm">
                          <span className="text-on-surface dark:text-white font-medium">{lang.name}</span>
                          <span className="text-primary dark:text-primary-fixed-dim">{lang.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-variant/20 dark:bg-surface-variant/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${colors[index] || "bg-primary"}`} 
                            style={{ width: `${lang.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center py-10 space-y-3">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant dark:text-surface-variant">code</span>
              <h4 className="font-semibold text-on-surface dark:text-white">GitHub Audit Ready</h4>
              <p className="text-on-surface-variant dark:text-surface-variant text-xs">Run a profile audit to parse repository metrics.</p>
            </div>
          )}

          {/* Quick Insights Action */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-secondary overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">lightbulb</span>
            </div>
            <h4 className="font-headline-md text-lg text-on-surface dark:text-white font-semibold mb-2">Smart Heuristic</h4>
            <p className="font-body-sm text-on-surface-variant dark:text-surface-variant text-sm mb-4 leading-relaxed">
              {history.length > 0 && history[0].analysis?.missingKeywords && history[0].analysis.missingKeywords.length > 0 ? (
                `Your target role highlights "${history[0].analysis.missingKeywords[0]}". Adding it to your experience section increases match probability.`
              ) : (
                "Ensure your bullet points contain measurable results like percentages and time improvements."
              )}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/lib/api-client";
import { IInsight } from "@portfolioiq/shared";

export default function AnalysisResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [insight, setInsight] = useState<IInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resume" | "github" | "critique">("resume");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/api/analysis/${id}/results`);
        if (res.data && res.data.success) {
          setInsight(res.data.data);
        } else {
          setError(res.data.error || "Failed to load analysis results");
        }
      } catch (err: any) {
        console.error("Results fetch error:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResults();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;
    try {
      const res = await apiClient.delete(`/api/analysis/${id}`);
      if (res.data && res.data.success) {
        router.push("/dashboard");
      } else {
        alert(res.data.error || "Failed to delete analysis");
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="space-y-gutter max-w-container-max mx-auto p-4">
        <div className="h-40 rounded-xl glass-panel skeleton-shimmer"></div>
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 lg:col-span-8 h-96 rounded-xl glass-panel skeleton-shimmer"></div>
          <div className="col-span-12 lg:col-span-4 h-96 rounded-xl glass-panel skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  if (error || !insight || !insight.analysis) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <h3 className="text-xl font-bold text-on-surface dark:text-white">Failed to Load Results</h3>
        <p className="text-on-surface-variant dark:text-surface-variant text-sm">{error || "The requested analysis results are incomplete."}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/95 transition-primary cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { analysis } = insight;

  return (
    <div className="space-y-gutter max-w-container-max mx-auto font-body-base px-1 md:px-0">
      
      {/* Top Banner & Header Summary */}
      <div className="glass-panel p-6 md:p-8 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
          {/* Match Rate Circle */}
          <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-variant/10" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeWidth="5"></circle>
              <circle 
                className="text-secondary dark:text-secondary-fixed-dim" 
                cx="48" 
                cy="48" 
                fill="transparent" 
                r="42" 
                stroke="currentColor" 
                strokeDasharray="263.8" 
                strokeDashoffset={263.8 - (263.8 * analysis.matchRate) / 100} 
                strokeWidth="5"
              ></circle>
            </svg>
            <span className="absolute text-2xl font-bold text-on-surface dark:text-white font-display-lg">
              {analysis.matchRate}%
            </span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary dark:text-primary-fixed-dim rounded-full text-[10px] font-bold tracking-widest uppercase">
              AI SCAN COMPLETED
            </span>
            <h1 className="font-display-lg text-2xl font-bold text-on-surface dark:text-white">
              {insight.targetJobTitle}
            </h1>
            <p className="text-on-surface-variant dark:text-surface-variant text-sm max-w-xl">
              {analysis.overallSummary}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full lg:w-auto shrink-0">
          <button 
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto px-5 py-2.5 bg-surface-variant/10 border border-black/10 dark:border-border-subtle text-on-surface dark:text-white font-semibold rounded-lg hover:bg-surface-variant/20 transition-primary cursor-pointer active:scale-[0.98] text-center"
          >
            Dashboard
          </button>
          <button 
            onClick={handleDelete}
            className="w-full sm:w-auto px-5 py-2.5 bg-error/15 text-error font-semibold rounded-lg hover:bg-error/25 transition-primary cursor-pointer active:scale-[0.98] text-center"
          >
            Delete Analysis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/10 dark:border-border-subtle gap-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab("resume")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === "resume" 
              ? "border-primary text-primary dark:text-primary-fixed-dim font-bold" 
              : "border-transparent text-on-surface-variant dark:text-surface-variant hover:text-on-surface dark:hover:text-white"
          }`}
        >
          Resume & Keywords
        </button>
        <button
          onClick={() => setActiveTab("github")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === "github" 
              ? "border-primary text-primary dark:text-primary-fixed-dim font-bold" 
              : "border-transparent text-on-surface-variant dark:text-surface-variant hover:text-on-surface dark:hover:text-white"
          }`}
        >
          GitHub Code Audit ({analysis.githubAudit?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("critique")}
          className={`pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 cursor-pointer shrink-0 ${
            activeTab === "critique" 
              ? "border-primary text-primary dark:text-primary-fixed-dim font-bold" 
              : "border-transparent text-on-surface-variant dark:text-surface-variant hover:text-on-surface dark:hover:text-white"
          }`}
        >
          AI Coach Critique
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-12 gap-gutter">
        
        {/* Active Tab Content Area */}
        <div className="col-span-12 lg:col-span-8 space-y-gutter">
          
          {activeTab === "resume" && (
            <div className="space-y-gutter">
              {/* Bullet Improvements */}
              <div className="glass-panel p-5 sm:p-6 rounded-xl space-y-6">
                <h3 className="font-headline-md text-lg text-on-surface dark:text-white font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim shrink-0">verified_user</span>
                  Resume Experience Optimization
                </h3>
                
                <div className="space-y-6">
                  {analysis.suggestedBulletPoints.map((bullet, idx) => (
                    <div key={idx} className="border border-black/10 dark:border-border-subtle rounded-xl overflow-hidden bg-surface-variant/5 dark:bg-surface-dark/40">
                      {/* Original bullet */}
                      <div className="p-4 bg-error/5 border-b border-black/10 dark:border-border-subtle flex gap-3">
                        <span className="material-symbols-outlined text-error text-[20px] mt-0.5 shrink-0">close</span>
                        <div className="space-y-1">
                          <span className="text-[10px] font-label-caps text-error font-bold">ORIGINAL EXPERIENCE EXCERPT</span>
                          <p className="text-on-surface-variant dark:text-surface-variant text-sm">{bullet.original}</p>
                        </div>
                      </div>
                      
                      {/* Improved bullet */}
                      <div className="p-4 bg-primary/5 flex gap-3 border-b border-black/10 dark:border-border-subtle">
                        <span className="material-symbols-outlined text-primary dark:text-secondary-fixed-dim text-[20px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                        <div className="space-y-1">
                          <span className="text-[10px] font-label-caps text-primary dark:text-secondary-fixed-dim font-bold">OPTIMIZED AI RECOMMENDATION</span>
                          <p className="text-on-surface dark:text-white text-sm font-medium leading-relaxed">{bullet.improved}</p>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="p-3.5 bg-surface-variant/5 text-on-surface-variant dark:text-surface-variant text-xs flex items-center gap-2 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed-dim shrink-0">info</span>
                        <span className="leading-relaxed">{bullet.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "github" && (
            <div className="glass-panel p-5 sm:p-6 rounded-xl space-y-6">
              <h3 className="font-headline-md text-lg text-on-surface dark:text-white font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-primary-fixed-dim shrink-0">code</span>
                GitHub Repository Auditing Report
              </h3>
              
              {analysis.githubAudit && analysis.githubAudit.length > 0 ? (
                <div className="space-y-6">
                  {analysis.githubAudit.map((repo, idx) => (
                    <div key={idx} className="p-5 rounded-xl border border-black/10 dark:border-border-subtle bg-surface-variant/5 dark:bg-surface-dark/50 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-base font-bold text-on-surface dark:text-white flex items-center gap-1.5 break-all">
                            {repo.repoName}
                          </h4>
                          <span className="text-xs text-primary dark:text-primary-fixed-dim font-medium">{repo.language}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface-variant/10 border border-black/10 dark:border-border-subtle text-xs font-semibold text-secondary dark:text-secondary-fixed-dim shrink-0">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {repo.stars}
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-black/10 dark:border-border-subtle/50">
                        <span className="text-[10px] font-label-caps text-on-surface-variant dark:text-surface-variant font-bold tracking-wider block">KEY AUDIT FINDINGS</span>
                        <ul className="space-y-2">
                          {repo.findings.map((finding, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2.5 text-sm">
                              <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim text-lg mt-0.5 shrink-0">check_circle</span>
                              <span className="text-on-surface/90 dark:text-white/90 leading-relaxed">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant dark:text-surface-variant">terminal</span>
                  <p className="text-on-surface-variant dark:text-surface-variant text-sm">No repository analysis metrics compiled for this session.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "critique" && (
            <div className="glass-panel p-5 sm:p-6 rounded-xl space-y-4">
              <h3 className="font-headline-md text-lg text-on-surface dark:text-white font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim shrink-0">psychology</span>
                Career Coach Assessment Critique
              </h3>
              
              <div className="text-on-surface/95 dark:text-white/95 text-sm leading-relaxed whitespace-pre-wrap space-y-4 pt-2">
                {analysis.portfolioCritique}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar: Keywords widgets */}
        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          {/* Missing keywords */}
          <div className="glass-panel p-5 sm:p-6 rounded-xl space-y-4">
            <h4 className="font-headline-md text-base text-on-surface dark:text-white font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-error text-lg shrink-0">dangerous</span>
              Missing Keywords ({analysis.missingKeywords.length})
            </h4>
            <p className="text-on-surface-variant dark:text-surface-variant text-xs leading-relaxed">
              These target job tools or skills were not detected in your resume markdown:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {analysis.missingKeywords.map((kw, idx) => (
                <span key={idx} className="px-2.5 py-1 text-xs font-semibold bg-error/10 border border-error/20 text-error rounded-full uppercase tracking-wide">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Found keywords */}
          <div className="glass-panel p-5 sm:p-6 rounded-xl space-y-4">
            <h4 className="font-headline-md text-base text-on-surface dark:text-white font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary dark:text-secondary-fixed-dim text-lg shrink-0">check_circle</span>
              Matched Keywords ({analysis.foundKeywords.length})
            </h4>
            <p className="text-on-surface-variant dark:text-surface-variant text-xs leading-relaxed">
              Successfully matched alignments from experience sections:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {analysis.foundKeywords.map((kw, idx) => (
                <span key={idx} className="px-2.5 py-1 text-xs font-semibold bg-secondary/10 border border-secondary/20 text-secondary dark:text-secondary-fixed-dim rounded-full uppercase tracking-wide">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

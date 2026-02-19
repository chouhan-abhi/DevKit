import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Star, GitFork, Eye, Calendar, Code, ExternalLink, Search,
  TrendingUp, Loader2, AlertCircle, Clock, FileCode, Shield,
} from "lucide-react";
import { DEFAULT_QUERY_OPTIONS } from "../../../app/queryConfig";
import { storage } from "../../../shared/services/StorageManager";

const POPULAR_LANGUAGES = [
  "All Languages", "JavaScript", "TypeScript", "Python", "Java", "Go",
  "Rust", "C++", "C#", "PHP", "Ruby", "Swift", "Kotlin", "Dart",
  "HTML", "CSS", "Shell", "PowerShell",
];

const DATE_RANGES = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "Last year", value: 365 },
  { label: "All time", value: null },
];

const getDateString = (daysAgo) => {
  if (!daysAgo) return null;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

const fetchTrendingRepos = async ({ language, dateRange, searchQuery }) => {
  const queryParts = ["stars:>10"];
  if (language && language !== "All Languages") {
    queryParts.push(`language:${language.toLowerCase()}`);
  }
  if (dateRange !== null) {
    const dateStr = getDateString(dateRange);
    if (dateStr) queryParts.push(`created:>${dateStr}`);
  }
  if (searchQuery?.trim()) {
    queryParts.push(`${searchQuery.trim()} in:name,description`);
  }
  const query = queryParts.join(" ");
  const url = `https://api.github.com/search/repositories?sort=stars&order=desc&q=${encodeURIComponent(query)}&per_page=30`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 403) throw new Error("GitHub API rate limit exceeded. Please try again later.");
    throw new Error(`Failed to fetch repositories: ${errorData?.message || response.statusText}`);
  }
  return response.json();
};

const formatNumber = (num) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const getTimeAgo = (dateString) => {
  const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

const formatSize = (sizeInKB) => sizeInKB < 1024 ? `${sizeInKB} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`;

export default function GitHubTrending() {
  const savedFilters = storage.get("github-trending:filters", null);
  const [selectedLanguage, setSelectedLanguage] = useState(savedFilters?.language || "All Languages");
  const [selectedDateRange, setSelectedDateRange] = useState(savedFilters?.dateRange ?? 7);
  const [searchQuery, setSearchQuery] = useState(savedFilters?.searchQuery || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    storage.set("github-trending:filters", { language: selectedLanguage, dateRange: selectedDateRange, searchQuery });
  }, [selectedLanguage, selectedDateRange, searchQuery]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["github-trending", selectedLanguage, selectedDateRange, debouncedSearchQuery],
    queryFn: () => fetchTrendingRepos({ language: selectedLanguage, dateRange: selectedDateRange, searchQuery: debouncedSearchQuery }),
    ...DEFAULT_QUERY_OPTIONS,
    staleTime: 1000 * 60 * 5,
  });

  const repos = data?.items || [];
  const totalCount = data?.total_count || 0;

  const stats = useMemo(() => {
    if (!repos.length) return null;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    return { totalStars, totalForks, avgStars: Math.round(totalStars / repos.length) };
  }, [repos]);

  const handleSearch = (e) => { e.preventDefault(); refetch(); };

  const inputStyle = {
    background: "var(--bg-color)",
    color: "var(--text-color)",
    border: "1px solid var(--border-color)",
  };

  return (
    <div className="h-full w-full flex overflow-hidden" style={{ background: "var(--bg-color)", color: "var(--text-color)" }}>
      {/* Sidebar Filters */}
      <aside
        className="w-60 md:w-64 shrink-0 overflow-y-auto p-4 border-r hidden md:block"
        style={{ background: "var(--panel-color)", borderColor: "var(--border-color)" }}
      >
        <div className="sticky top-0">
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text-color)" }}>Filters</h2>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="gh-search" className="flex items-center gap-2 mb-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <Search size={13} /> Search
              </label>
              <input id="gh-search" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repos..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>

            <div>
              <label htmlFor="gh-lang" className="flex items-center gap-2 mb-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <Code size={13} /> Language
              </label>
              <select id="gh-lang" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                {POPULAR_LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="gh-date" className="flex items-center gap-2 mb-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                <Calendar size={13} /> Date Range
              </label>
              <select id="gh-date" value={selectedDateRange} onChange={(e) => setSelectedDateRange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                {DATE_RANGES.map((range) => <option key={range.value || "all"} value={range.value || ""}>{range.label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--primary-color)" }}>
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : <><Search size={14} /> Search</>}
            </button>
          </form>

          {stats && (
            <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--border-color)" }}>
              <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <TrendingUp size={13} style={{ color: "var(--primary-color)" }} /> Statistics
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Stars", value: formatNumber(stats.totalStars), Ico: Star },
                  { label: "Forks", value: formatNumber(stats.totalForks), Ico: GitFork },
                  { label: "Avg", value: formatNumber(stats.avgStars), Ico: Star },
                ].map((stat) => (
                  <div key={stat.label} className="p-2 rounded-lg text-center" style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                    <stat.Ico size={11} className="mx-auto mb-0.5" style={{ color: "var(--primary-color)" }} />
                    <p className="text-xs font-bold" style={{ color: "var(--text-color)" }}>{stat.value}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
        {!isLoading && !error && (
          <p className="text-xs font-medium mb-4" style={{ color: "var(--text-muted)" }}>
            {totalCount.toLocaleString()} repositories found
          </p>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
            <AlertCircle size={18} style={{ color: "var(--accent-red)" }} />
            <p className="text-sm" style={{ color: "var(--text-color)" }}>{error?.message || String(error)}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary-color)" }} />
          </div>
        )}

        {!isLoading && !error && repos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col"
                style={{ background: "var(--panel-color)", borderColor: "var(--border-color)", boxShadow: "var(--shadow-xs)" }}
              >
                <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl transition-all duration-200 group-hover:w-1" style={{ background: "var(--primary-color)" }} />

                <div className="relative flex flex-col h-full">
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-bold truncate" style={{ color: "var(--primary-color)" }}>{repo.full_name}</h3>
                    </div>
                    {repo.description && (
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>{repo.description}</p>
                    )}
                  </div>

                  {repo.owner && (
                    <div className="flex items-center gap-2 mb-3">
                      {repo.owner.avatar_url && (
                        <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-4 h-4 rounded-full" />
                      )}
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{repo.owner.login}</span>
                      {repo.archived && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto font-medium" style={{ background: "rgba(239, 68, 68, 0.08)", color: "var(--accent-red)" }}>Archived</span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 text-[11px] border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    {repo.language && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                        <Code size={10} style={{ color: "var(--primary-color)" }} />
                        <span className="font-medium">{repo.language}</span>
                      </span>
                    )}
                    {repo.license && (
                      <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <Shield size={10} /> {repo.license.spdx_id || repo.license.name}
                      </span>
                    )}
                    {repo.size > 0 && (
                      <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <FileCode size={10} /> {formatSize(repo.size)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1 text-[11px] font-semibold">
                      <Star size={12} style={{ color: "var(--primary-color)" }} /> {formatNumber(repo.stargazers_count)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <GitFork size={12} /> {formatNumber(repo.forks_count)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <Eye size={12} /> {formatNumber(repo.watchers_count)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(repo.created_at)}</span>
                    {repo.updated_at && <span className="flex items-center gap-1"><Clock size={10} /> {getTimeAgo(repo.updated_at)}</span>}
                  </div>

                  <div className="mt-auto pt-2">
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span key={topic} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                            style={{ background: "var(--bg-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 3 && (
                          <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>+{repo.topics.length - 3}</span>
                        )}
                      </div>
                    )}
                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)", background: "var(--bg-color)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-color)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--primary-color)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-color)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-color)"; }}>
                      <ExternalLink size={12} /> Open Repo
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <TrendingUp size={40} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>No repositories found. Try adjusting your filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}

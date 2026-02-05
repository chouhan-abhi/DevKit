import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  GitFork,
  Eye,
  Calendar,
  Code,
  ExternalLink,
  Search,
  Filter,
  TrendingUp,
  Loader2,
  AlertCircle,
  Globe,
  Users,
  Clock,
  FileCode,
  Tag,
  GitBranch,
  Shield,
} from "lucide-react";
import { DEFAULT_QUERY_OPTIONS } from "../utils/Constants";
import { storage } from "../utils/StorageManager";

const POPULAR_LANGUAGES = [
  "All Languages",
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "HTML",
  "CSS",
  "Shell",
  "PowerShell",
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
  const queryParts = [];
  
  // Base filter: repositories with at least 10 stars
  queryParts.push("stars:>10");
  
  // Language filter
  if (language && language !== "All Languages") {
    queryParts.push(`language:${language.toLowerCase()}`);
  }
  
  // Date range filter
  if (dateRange !== null) {
    const dateStr = getDateString(dateRange);
    if (dateStr) {
      queryParts.push(`created:>${dateStr}`);
    }
  }
  
  // Search query - GitHub search supports searching in name, description, readme
  if (searchQuery?.trim()) {
    const searchTerm = searchQuery.trim();
    // For GitHub API, search terms can be added directly or with in: qualifier
    // We'll search in name and description
    queryParts.push(`${searchTerm} in:name,description`);
  }

  // Join with spaces (GitHub API uses spaces, not +)
  const query = queryParts.join(" ");
  const url = `https://api.github.com/search/repositories?sort=stars&order=desc&q=${encodeURIComponent(query)}&per_page=30`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again later.");
    }
    const errorMessage = errorData?.message || response.statusText;
    throw new Error(`Failed to fetch repositories: ${errorMessage}`);
  }
  
  const data = await response.json();
  return data;
};

const formatNumber = (num) => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatSize = (sizeInKB) => {
  if (sizeInKB < 1024) {
    return `${sizeInKB} KB`;
  }
  return `${(sizeInKB / 1024).toFixed(1)} MB`;
};

const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

export default function GitHubTrending() {
  const savedFilters = storage.get("github-trending:filters", null);
  const [selectedLanguage, setSelectedLanguage] = useState(
    savedFilters?.language || "All Languages"
  );
  const [selectedDateRange, setSelectedDateRange] = useState(
    savedFilters?.dateRange ?? 7
  );
  const [searchQuery, setSearchQuery] = useState(savedFilters?.searchQuery || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const debounceTimerRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    storage.set("github-trending:filters", {
      language: selectedLanguage,
      dateRange: selectedDateRange,
      searchQuery,
    });
  }, [selectedLanguage, selectedDateRange, searchQuery]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["github-trending", selectedLanguage, selectedDateRange, debouncedSearchQuery],
    queryFn: () => fetchTrendingRepos({ language: selectedLanguage, dateRange: selectedDateRange, searchQuery: debouncedSearchQuery }),
    ...DEFAULT_QUERY_OPTIONS,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const repos = data?.items || [];
  const totalCount = data?.total_count || 0;

  const stats = useMemo(() => {
    if (!repos.length) return null;
    
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const totalWatchers = repos.reduce((sum, repo) => sum + repo.watchers_count, 0);
    const languages = {};
    
    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    }
    
    const topLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang);

    return {
      totalStars,
      totalForks,
      totalWatchers,
      topLanguages,
      avgStars: Math.round(totalStars / repos.length),
    };
  }, [repos]);

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div
      className="h-full w-[96%] flex overflow-hidden"
      style={{ background: "var(--bg-color)", color: "var(--text-color)" }}
    >
      {/* Left Sidebar - Filters */}
      <aside
        className="w-64 md:w-72 shrink-0 overflow-y-auto p-4"
        style={{
          background: "var(--panel-color)"
        }}
      >
        <div className="sticky top-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-color)" }}
              >
                Filters
              </h2>
            </div>
          </div>

          {/* Filters Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div>
              <label
                htmlFor="search-input"
                className="flex items-center gap-2 mb-2 text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                <Search size={16} />
                Search
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search repos..."
                  className="w-full pl-3 pr-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-color)",
                    color: "var(--text-color)",
                    border: "1px solid var(--border-color)",
                  }}
                />
              </div>
            </div>

            {/* Language Filter */}
            <div>
              <label
                htmlFor="language-select"
                className="flex items-center gap-2 mb-2 text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                <Code size={16} />
                Language
              </label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--bg-color)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {POPULAR_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label
                htmlFor="date-range-select"
                className="flex items-center gap-2 mb-2 text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                <Calendar size={16} />
                Date Range
              </label>
              <select
                id="date-range-select"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--bg-color)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {DATE_RANGES.map((range) => (
                  <option key={range.value || "all"} value={range.value || ""}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: "var(--sidebar-icon-bg)" }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
          </form>

          {/* Stats in Sidebar */}
          {stats && (
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: "var(--primary-color)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                  Statistics
                </h3>
              </div>
              
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star size={12} style={{ color: "var(--primary-color)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                      Stars
                    </span>
                  </div>
                  <p className="text-base font-bold" style={{ color: "var(--text-color)" }}>
                    {formatNumber(stats.totalStars)}
                  </p>
                </div>
                
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <GitFork size={12} style={{ color: "var(--primary-color)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                      Forks
                    </span>
                  </div>
                  <p className="text-base font-bold" style={{ color: "var(--text-color)" }}>
                    {formatNumber(stats.totalForks)}
                  </p>
                </div>
                
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Eye size={12} style={{ color: "var(--primary-color)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                      Watchers
                    </span>
                  </div>
                  <p className="text-base font-bold" style={{ color: "var(--text-color)" }}>
                    {formatNumber(stats.totalWatchers)}
                  </p>
                </div>
                
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: "var(--bg-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star size={12} style={{ color: "var(--primary-color)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                      Avg Stars
                    </span>
                  </div>
                  <p className="text-base font-bold" style={{ color: "var(--text-color)" }}>
                    {formatNumber(stats.avgStars)}
                  </p>
                </div>
              </div>

              {/* Top Languages */}
              {stats.topLanguages && stats.topLanguages.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code size={14} style={{ color: "var(--primary-color)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-color)" }}>
                      Top Languages
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.topLanguages.map((lang, index) => (
                      <span
                        key={lang}
                        className="text-xs px-2 py-1 rounded-md font-medium"
                        style={{
                          background: index === 0 ? "var(--primary-color)" : "var(--bg-color)",
                          color: index === 0 ? "white" : "var(--text-color)",
                          border: index === 0 ? "none" : "1px solid var(--border-color)",
                          opacity: index === 0 ? 1 : 0.9,
                        }}
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Repos Count */}
              <div
                className="mt-4 p-2.5 rounded-lg text-center"
                style={{
                  background: "var(--bg-color)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                  Repositories
                </p>
                <p className="text-lg font-bold" style={{ color: "var(--primary-color)" }}>
                  {repos.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">

        {/* Header */}
        <div className="mb-4">
          {/* Results Count */}
          {!isLoading && !error && (
              <p className="text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
                Found {totalCount.toLocaleString()} repositories
              </p>
          )}
        </div>

      {/* Error State */}
      {error && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center gap-3"
          style={{
            background: "var(--panel-color)",
            border: "1px solid var(--border-color)",
          }}
        >
          <AlertCircle size={20} style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "var(--text-color)" }}>
            {error?.message || String(error) || "An error occurred while fetching repositories"}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary-color)" }} />
        </div>
      )}

        {/* Repositories Grid */}
        {!isLoading && !error && repos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="group relative p-4 rounded-lg border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-[380px]"
                style={{
                  background: "var(--panel-color)",
                  borderColor: "var(--border-color)",
                }}
              >
                {/* Left Accent Strip */}
                <div
                  className="absolute left-0 top-0 h-full w-0.5 transition-all duration-300 group-hover:w-1.5"
                  style={{ background: "var(--primary-color)" }}
                />

                {/* Hover Glow Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{ background: "var(--primary-color)" }}
                />

                <div className="relative flex flex-col h-full">
                  {/* Header Section */}
                  <div className="mb-3 shrink-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base font-bold mb-2 truncate"
                          style={{ color: "var(--primary-color)" }}
                        >
                          {repo.full_name}
                        </h3>
                        {repo.description ? (
                          <p
                            className="text-xs leading-relaxed line-clamp-3 min-h-[48px]"
                            style={{ color: "var(--text-color)", opacity: 0.75 }}
                          >
                            {repo.description}
                          </p>
                        ) : (
                          <div className="min-h-[48px]" />
                        )}
                      </div>
                    </div>

                    {/* Owner Badge */}
                    {repo.owner && (
                      <div className="flex items-center gap-2 mb-2">
                        {repo.owner.avatar_url && (
                          <img
                            src={repo.owner.avatar_url}
                            alt={repo.owner.login}
                            className="w-5 h-5 rounded-full border"
                            style={{ borderColor: "var(--border-color)" }}
                          />
                        )}
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--text-color)", opacity: 0.8 }}
                        >
                          {repo.owner.login}
                        </span>
                        {repo.archived && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded ml-auto"
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}
                          >
                            Archived
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Meta Info Row */}
                  <div
                    className="flex flex-wrap items-center gap-2 mb-3 pb-3 text-xs shrink-0"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    {repo.language && (
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                        style={{
                          background: "var(--bg-color)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <Code size={12} style={{ color: "var(--primary-color)" }} />
                        <span className="font-medium" style={{ color: "var(--text-color)" }}>
                          {repo.language}
                        </span>
                      </div>
                    )}
                    {repo.license && (
                      <div className="flex items-center gap-1">
                        <Shield size={12} style={{ color: "var(--text-color)", opacity: 0.6 }} />
                        <span style={{ color: "var(--text-color)", opacity: 0.7 }}>
                          {repo.license.name}
                        </span>
                      </div>
                    )}
                    {repo.size && (
                      <div className="flex items-center gap-1">
                        <FileCode size={12} style={{ color: "var(--text-color)", opacity: 0.6 }} />
                        <span style={{ color: "var(--text-color)", opacity: 0.7 }}>
                          {formatSize(repo.size)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats Section */}
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star size={13} style={{ color: "var(--primary-color)" }} />
                        <span className="text-xs font-semibold" style={{ color: "var(--text-color)" }}>
                          {formatNumber(repo.stargazers_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork size={13} style={{ color: "var(--text-color)", opacity: 0.7 }} />
                        <span className="text-xs" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                          {formatNumber(repo.forks_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={13} style={{ color: "var(--text-color)", opacity: 0.7 }} />
                        <span className="text-xs" style={{ color: "var(--text-color)", opacity: 0.8 }}>
                          {formatNumber(repo.watchers_count)}
                        </span>
                      </div>
                    </div>
                    {repo.open_issues_count > 0 && (
                      <div
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background:
                            repo.open_issues_count > 10
                              ? "rgba(239, 68, 68, 0.15)"
                              : "var(--bg-color)",
                          color: repo.open_issues_count > 10 ? "#ef4444" : "var(--text-color)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {repo.open_issues_count}
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center gap-2 mb-3 pb-3 text-xs shrink-0" style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={11} style={{ color: "var(--text-color)", opacity: 0.5 }} />
                      <span style={{ color: "var(--text-color)", opacity: 0.6 }}>
                        {formatDate(repo.created_at)}
                      </span>
                    </div>
                    {repo.updated_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={11} style={{ color: "var(--text-color)", opacity: 0.5 }} />
                        <span style={{ color: "var(--text-color)", opacity: 0.6 }}>
                          {getTimeAgo(repo.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Topics/Tags - Moved to Bottom */}
                  <div className="mt-auto">
                    {repo.topics && repo.topics.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{
                              background: "var(--bg-color)",
                              color: "var(--text-color)",
                              border: "1px solid var(--border-color)",
                              opacity: 0.9,
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 3 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{ color: "var(--text-color)", opacity: 0.6 }}
                          >
                            +{repo.topics.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-5" />
                    )}
                    
                    {/* Open Repo Button */}
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-40 px-3 py-2 rounded-lg text-xs border font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                        background: "var(--bg-color)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--primary-color)";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.borderColor = "var(--primary-color)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-color)";
                        e.currentTarget.style.color = "var(--text-color)";
                        e.currentTarget.style.borderColor = "var(--border-color)";
                      }}
                    >
                      <ExternalLink size={14} />
                      Open Repository
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp size={48} style={{ color: "var(--text-color)", opacity: 0.3 }} />
            <p className="mt-4 text-sm" style={{ color: "var(--text-color)", opacity: 0.7 }}>
              No repositories found. Try adjusting your filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

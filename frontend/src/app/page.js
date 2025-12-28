"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState(null);

  // Use Environment Variable for Vercel, fallback to localhost for development
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const API_URL = BASE_URL.includes("/api/articles")
    ? BASE_URL
    : `${BASE_URL}/api/articles`;

  // Debug log
  console.log("🔍 API_URL:", API_URL);

  // Fetch data on load
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setApiError(null);
      const res = await axios.get(API_URL);
      // Ensure we always set an array
      setArticles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(
        "API connection failed. Check NEXT_PUBLIC_API_URL in Vercel settings.",
        err
      );
      setApiError("Failed to connect to API. Please check your configuration.");
      setArticles([]); // Ensure articles is always an array
    }
  };

  // Handle Scrape Button
  const handleScrape = async () => {
    setLoading(true);
    try {
      // Use the API_URL which already includes /api/articles
      const response = await axios.get(`${API_URL}/scrape`);
      if (response.data.success) {
        fetchArticles();
        alert(`✅ ${response.data.message}`);
      }
    } catch (err) {
      console.error("Scrape error:", err);
      alert("❌ Scrape failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Process pending articles (triggers backend AI processing)
  const handleProcessArticle = async (articleId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/process/${articleId}`);

      if (response.data.success) {
        alert("✅ Article processed successfully!");
        fetchArticles();
        // Refresh the selected article if it was processed
        if (selectedArticle?._id === articleId) {
          const updatedArticle = await axios.get(`${API_URL}/${articleId}`);
          setSelectedArticle(updatedArticle.data);
        }
      }
    } catch (err) {
      alert(
        "❌ Processing failed. " + (err.response?.data?.message || err.message)
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Article
  const handleDelete = async (articleId) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    setDeleteLoading(articleId);
    try {
      await axios.delete(`${API_URL}/${articleId}`);

      // If deleted article was selected, clear selection
      if (selectedArticle?._id === articleId) {
        setSelectedArticle(null);
      }

      // Refresh list
      fetchArticles();
      alert("✅ Article deleted successfully!");
    } catch (err) {
      alert("❌ Failed to delete article.");
      console.error(err);
    }
    setDeleteLoading(null);
  };

  // Download Article as HTML
  const handleDownload = (article) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    h2 { color: #2563eb; margin-top: 30px; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
    .references { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="meta">
    <p>Status: ${article.status} | Created: ${new Date(
      article.createdAt
    ).toLocaleDateString()}</p>
    <p>Original Source: <a href="${article.original_url}" target="_blank">${
      article.original_url
    }</a></p>
  </div>
  
  ${article.updated_content || article.original_content}
  
  ${
    article.references?.length > 0
      ? `
  <div class="references">
    <h3>References</h3>
    <ul>
      ${article.references
        .map(
          (ref) =>
            `<li><a href="${ref.url}" target="_blank">${ref.title}</a></li>`
        )
        .join("")}
    </ul>
  </div>
  `
      : ""
  }
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title
      .substring(0, 50)
      .replace(/[^a-z0-9]/gi, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter articles by search query
  const filteredArticles = articles.filter((art) =>
    art.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation
  const stats = {
    total: articles.length,
    completed: articles.filter((a) => a.status === "completed").length,
    pending: articles.filter((a) => a.status === "pending").length,
    failed: articles.filter((a) => a.status === "failed").length,
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-96 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col shadow-xl z-10 shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                BeyondChats
              </h2>
              <p className="text-xs text-slate-500">AI Article Manager</p>
            </div>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">{apiError}</p>
            </div>
          )}

          <button
            onClick={handleScrape}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Working...
              </>
            ) : (
              <>
                <span className="text-lg group-hover:scale-110 transition-transform">
                  ✨
                </span>
                Scrape New Articles
              </>
            )}
          </button>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-slate-100 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-slate-900">
                {stats.total}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Total
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-emerald-700">
                {stats.completed}
              </div>
              <div className="text-[10px] text-emerald-600 uppercase tracking-wide">
                Done
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-amber-700">
                {stats.pending}
              </div>
              <div className="text-[10px] text-amber-600 uppercase tracking-wide">
                Pending
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-700">
                {stats.failed}
              </div>
              <div className="text-[10px] text-red-600 uppercase tracking-wide">
                Failed
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200/60">
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <svg
              className="absolute left-3 top-3 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Article List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">
                {apiError ? "Unable to load articles" : "No articles found"}
              </p>
            </div>
          ) : (
            filteredArticles.map((art) => (
              <div
                key={art._id}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedArticle?._id === art._id
                    ? "bg-blue-50 border-blue-200 shadow-md shadow-blue-100"
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div onClick={() => setSelectedArticle(art)}>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2 leading-snug">
                    {art.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wide ${
                        art.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : art.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {art.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(art.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {art.status === "completed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(art);
                      }}
                      className="flex-1 py-1.5 px-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                      title="Download as HTML"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(art._id);
                    }}
                    disabled={deleteLoading === art._id}
                    className="flex-1 py-1.5 px-2 bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 disabled:text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Delete article"
                  >
                    {deleteLoading === art._id ? (
                      <svg
                        className="animate-spin h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-8">
        {selectedArticle ? (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-3">
                    {selectedArticle.title}
                  </h1>
                  <a
                    href={selectedArticle.original_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5 font-medium group"
                  >
                    <span>Visit Original Source</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>

                <div className="flex gap-2">
                  {selectedArticle.status === "completed" && (
                    <button
                      onClick={() => handleDownload(selectedArticle)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedArticle._id)}
                    disabled={deleteLoading === selectedArticle._id}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-500/30 active:scale-95 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Original */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-6 py-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                      Original Context
                    </span>
                  </div>
                </div>
                <div className="p-6 text-slate-600 text-sm leading-7 max-h-[600px] overflow-y-auto">
                  <p>
                    {selectedArticle.original_content ===
                    "Content fetch pending"
                      ? "The scraper identified this article URL. Full content will be processed and rewritten by the AI agent."
                      : selectedArticle.original_content}
                  </p>
                </div>
              </div>

              {/* Right: AI Enhanced */}
              <div
                className={`rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm transition-all hover:shadow-xl ${
                  selectedArticle.status === "completed"
                    ? "bg-gradient-to-br from-emerald-50/50 to-white border-emerald-200/60 ring-2 ring-emerald-100/50"
                    : "bg-white/80 border-slate-200/60"
                }`}
              >
                <div
                  className={`px-6 py-4 border-b flex items-center gap-2 ${
                    selectedArticle.status === "completed"
                      ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200/60"
                      : "bg-gradient-to-r from-slate-50 to-slate-100/50 border-slate-200/60"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedArticle.status === "completed"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-400 animate-pulse"
                    }`}
                  ></div>
                  <span
                    className={`font-bold text-sm uppercase tracking-wider ${
                      selectedArticle.status === "completed"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    AI Enhanced Version
                  </span>
                </div>

                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {selectedArticle.status === "completed" ? (
                    <div className="prose prose-sm prose-slate max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedArticle.updated_content,
                        }}
                        className="[&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-slate-800 [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-slate-700 [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-4 [&>p]:text-slate-600 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2 [&>li]:text-slate-600 [&>strong]:text-slate-900 [&>strong]:font-semibold"
                      />

                      {selectedArticle.references?.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            References Used
                          </h5>
                          <ul className="space-y-3">
                            {selectedArticle.references.map((ref, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 group"
                              >
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline line-clamp-2 group-hover:line-clamp-none transition-all"
                                >
                                  {ref.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-slate-900 font-bold text-lg mb-2">
                        Content Pending
                      </h3>
                      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
                        This article hasn't been processed yet. Click the button
                        below to generate AI-enhanced content.
                      </p>
                      <button
                        onClick={() =>
                          handleProcessArticle(selectedArticle._id)
                        }
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Process Article Now
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
              <svg
                className="w-12 h-12 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-600 mb-2">
              No Article Selected
            </p>
            <p className="text-sm text-slate-400">
              Choose an article from the sidebar to view details
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

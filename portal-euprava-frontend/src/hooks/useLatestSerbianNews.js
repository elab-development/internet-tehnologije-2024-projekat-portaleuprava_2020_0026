// src/hooks/useLatestSerbianNews.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function normalizeGdeltArticle(a) {
  const title = a?.title ?? "-";
  const url = a?.url ?? null;
  const source = a?.sourceCollection ?? a?.domain ?? a?.sourceCountry ?? "-";
  const publishedAt = a?.seendate ?? a?.datetime ?? a?.date ?? null;

  return {
    title,
    url,
    source,
    publishedAt,
    raw: a,
  };
}

/**
 * Public API used: GDELT 2.1 DOC API (no key needed).
 * It returns latest articles related to "Serbia".
 */
export default function useLatestSerbianNews(options = {}) {
  const limit = options?.limit ?? 6;
  const autoRefreshMs = options?.autoRefreshMs ?? 0;

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const abortRef = useRef(null);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({
      query: "Serbia",
      mode: "ArtList",
      format: "json",
      sort: "HybridRel",
      maxrecords: String(limit),
    });

    return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
  }, [limit]);

  const fetchNews = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const articles = Array.isArray(json?.articles) ? json.articles : [];
      const normalized = articles.map(normalizeGdeltArticle).filter((x) => x.url);

      setNews(normalized);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError("Nije moguće učitati vesti.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchNews();

    if (!autoRefreshMs || autoRefreshMs < 5000) return undefined;

    const t = setInterval(() => {
      fetchNews();
    }, autoRefreshMs);

    return () => clearInterval(t);
  }, [fetchNews, autoRefreshMs]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { news, loading, error, refetch: fetchNews };
}

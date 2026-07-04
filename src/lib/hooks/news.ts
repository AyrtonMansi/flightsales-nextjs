import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Public-read of published news articles. Used by the homepage News
// rail (limit 3) and the standalone /news page (limit 20).
//
// First TypeScript module in the per-domain hooks split — pilot for
// the rest. Pattern: explicit prop types, narrow return type, minimal
// `any` (only where the Supabase row shape isn't generated yet).
// Once we adopt @supabase/ssr's typegen, swap NewsArticle for the
// generated `Database['public']['Tables']['news_articles']['Row']`.

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  date: string;       // YYYY-MM-DD
  read_time: number;
  slug: string;
  published: boolean;
  created_at?: string;
}

export interface UseNewsReturn {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
}

export function useNews(limit: number = 6): UseNewsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const { data, error: err } = await supabase
          .from('news_articles')
          .select('*')
          .eq('published', true)
          .order('date', { ascending: false })
          .limit(limit);
        if (err) throw err;
        if (cancelled) return;
        setArticles((data as NewsArticle[]) || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [limit]);

  return { articles, loading, error };
}

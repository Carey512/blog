import { useEffect, useState } from 'react';
import { blogService, type Post } from '../services/blogService';

export function usePublishedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadPosts() {
      try {
        setLoading(true);
        setError('');
        const nextPosts = await blogService.getPosts('published');

        if (alive) {
          setPosts(nextPosts);
        }
      } catch {
        if (alive) {
          setError('failed');
          setPosts([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      alive = false;
    };
  }, []);

  return {
    error,
    loading,
    posts,
  };
}

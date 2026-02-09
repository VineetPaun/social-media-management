import { useState, useEffect } from "react";
import {
  fetchPosts,
  deletePost,
  toAssetUrl,
  type PostRecord,
  ApiClientError,
} from "../api";

interface PostsFeedProps {
  token: string;
  refreshTrigger: number;
}

export function PostsFeed({ token, refreshTrigger }: PostsFeedProps) {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPosts(token);
        setPosts(result.data || []);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to load posts");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [token, refreshTrigger]);

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost({ token, postId });
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to delete post");
      }
    }
  };

  if (loading) {
    return <div className="feed-status">Loading posts...</div>;
  }

  if (error) {
    return <div className="feed-status error">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="feed-status">No posts yet. Create your first post!</div>
    );
  }

  return (
    <div className="posts-feed">
      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <img src={toAssetUrl(post.image)} alt="Post" className="post-image" />
          {post.description && (
            <p className="post-description">{post.description}</p>
          )}
          <button onClick={() => handleDelete(post.id)} className="btn-delete">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

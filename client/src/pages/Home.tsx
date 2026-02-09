import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchPosts,
  deletePost,
  toAssetUrl,
  type PostRecord,
  type SignInData,
  ApiClientError,
} from "../api";

interface HomeProps {
  auth: SignInData | null;
  onPostDeleted: () => void;
  refreshTrigger: number;
}

export function Home({ auth, onPostDeleted, refreshTrigger }: HomeProps) {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      if (!auth?.token) {
        // No auth - show empty state with prompt to sign in
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await fetchPosts(auth.token);
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
  }, [auth, refreshTrigger]);

  const handleDelete = async (postId: string) => {
    if (!auth?.token) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost({ token: auth.token, postId });
      setPosts(posts.filter((p) => p.id !== postId));
      onPostDeleted();
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to delete post");
      }
    }
  };

  return (
    <div className="home">
      <div className="home-header">
        <h2>Feed</h2>
        {auth && (
          <Link to="/create" className="btn-primary">
            Create Post
          </Link>
        )}
      </div>

      {!auth && (
        <div className="feed-status">
          <p>Welcome to Instagram!</p>
          <p>
            <Link to="/signin" className="link">
              Sign in
            </Link>{" "}
            to view and create posts.
          </p>
        </div>
      )}

      {auth && loading && <div className="feed-status">Loading posts...</div>}

      {auth && error && <div className="feed-status error">{error}</div>}

      {auth && !loading && !error && posts.length === 0 && (
        <div className="feed-status">No posts yet. Create your first post!</div>
      )}

      {auth && !loading && !error && posts.length > 0 && (
        <div className="posts-feed">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <span className="post-author">
                  {post.userName || "Unknown User"}
                </span>
              </div>
              <img
                src={toAssetUrl(post.image)}
                alt="Post"
                className="post-image"
              />
              {post.description && (
                <p className="post-description">{post.description}</p>
              )}
              {auth.userId === post.userId && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

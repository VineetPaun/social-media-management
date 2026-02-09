import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchPost,
  fetchComments,
  toggleLike,
  createComment,
  deleteComment,
  deletePost,
  toAssetUrl,
  type PostRecord,
  type CommentRecord,
  type SignInData,
  ApiClientError,
} from "../api";

// Props interface for PostDetail component
interface PostDetailProps {
  auth: SignInData | null; // Current user authentication data
}

/**
 * PostDetail component - Displays individual post with comments functionality
 * Allows users to view post details, like/unlike, and manage comments
 */
export function PostDetail({ auth }: PostDetailProps) {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  // Component state
  const [post, setPost] = useState<PostRecord | null>(null);        // Post data
  const [comments, setComments] = useState<CommentRecord[]>([]);    // Comments array
  const [loading, setLoading] = useState(true);                    // Loading state
  const [error, setError] = useState<string | null>(null);         // Error message
  const [commentText, setCommentText] = useState("");              // New comment input
  const [submitting, setSubmitting] = useState(false);             // Comment submission state
  const commentsEndRef = useRef<HTMLDivElement>(null);             // Reference for scrolling

  // Load post and comments data on component mount
  // Load post data and comments on component mount
  useEffect(() => {
    const load = async () => {
      if (!auth?.token || !postId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch post and comments in parallel
        const [postResult, commentsResult] = await Promise.all([
          fetchPost({ token: auth.token, postId }),
          fetchComments({ token: auth.token, postId }),
        ]);
        setPost(postResult.data);
        setComments(commentsResult.data || []);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to load post");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth, postId]);

  // Handle like/unlike toggle for the post
  // Handle like/unlike toggle for the post
  const handleLike = async () => {
    if (!auth?.token || !postId || !post) return;

    try {
      const result = await toggleLike({ token: auth.token, postId });
      // Update post state with new like status
      setPost({
        ...post,
        likedByMe: result.data.liked,
        likeCount: result.data.likeCount,
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      }
    }
  };

  // Handle new comment submission
  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.token || !postId || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const result = await createComment({
        token: auth.token,
        postId,
        content: commentText.trim(),
      });
      // Add new comment to the beginning of comments array
      setComments([result.data, ...comments]);
      setCommentText(""); // Clear input
      // Update post comment count
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to add comment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment deletion
  // Handle comment deletion (only for comment author)
  const handleDeleteComment = async (commentId: string) => {
    if (!auth?.token) return;

    try {
      await deleteComment({ token: auth.token, commentId });
      // Remove comment from local state
      setComments(comments.filter((c) => c.id !== commentId));
      // Update post comment count
      if (post) {
        setPost({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      }
    }
  };

  // Handle post deletion with confirmation
  // Handle post deletion (only for post author)
  const handleDeletePost = async () => {
    if (!auth?.token || !postId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost({ token: auth.token, postId });
      navigate("/"); // Navigate back to home after deletion
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to delete post");
      }
    }
  };

  // Format timestamp to relative time with "ago" suffix
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${diffWeeks}w ago`;
  };

  // Show signin prompt for unauthenticated users
  if (!auth) {
    return (
      <div className="post-detail-page">
        <div className="feed-status">
          <p>Please sign in to view this post.</p>
          <Link to="/signin" className="link">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="feed-status">Loading post...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="post-detail-page">
        <div className="feed-status error">{error}</div>
      </div>
    );
  }

  // Show not found state
  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="feed-status">Post not found</div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-card">
        {/* Post Header */}
        <div className="post-detail-header">
          <Link
            to={`/profile/${post.userId}`}
            className="post-detail-author-link"
          >
            {post.userProfilePic ? (
              <img
                src={toAssetUrl(post.userProfilePic)}
                alt={post.userName || "User"}
                className="post-author-pic"
              />
            ) : (
              <div className="post-author-pic-placeholder">
                {(post.userName || "U")[0].toUpperCase()}
              </div>
            )}
            <span className="post-author">
              {post.userName || "Unknown User"}
            </span>
          </Link>
          <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
        </div>

        {/* Post Image */}
        <img
          src={toAssetUrl(post.image)}
          alt="Post"
          className="post-detail-image"
        />

        {/* Actions */}
        <div className="post-actions">
          <button
            className={`post-action-btn like-btn ${post.likedByMe ? "liked" : ""}`}
            onClick={handleLike}
          >
            <svg
              className="action-icon"
              viewBox="0 0 24 24"
              fill={post.likedByMe ? "#ed4956" : "none"}
              stroke={post.likedByMe ? "#ed4956" : "currentColor"}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="post-action-btn comment-btn" onClick={() => {
            const input = document.querySelector<HTMLInputElement>('.comment-input');
            input?.focus();
          }}>
            <svg
              className="action-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Like Count */}
        <div className="post-stats">
          {post.likeCount > 0 && (
            <span className="post-likes">
              {post.likeCount} like{post.likeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Description */}
        {post.description && (
          <p className="post-description">
            <span className="post-description-author">
              {post.userName || "Unknown"}
            </span>{" "}
            {post.description}
          </p>
        )}

        {/* Delete button for own posts */}
        {auth.userId === post.userId && (
          <button onClick={handleDeletePost} className="btn-delete post-delete-btn">
            Delete Post
          </button>
        )}

        {/* Comments Section */}
        <div className="comments-section">
          <h3 className="comments-title">
            Comments {post.commentCount > 0 ? `(${post.commentCount})` : ""}
          </h3>

          {/* Comment Form */}
          <form className="comment-form" onSubmit={handleSubmitComment}>
            {auth.userId && (
              <div className="comment-form-avatar">
                <div className="post-author-pic-placeholder small">
                  {(auth.userName || "U")[0].toUpperCase()}
                </div>
              </div>
            )}
            <input
              type="text"
              className="comment-input"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? "..." : "Post"}
            </button>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {comments.length === 0 && (
              <p className="no-comments">
                No comments yet. Be the first to comment!
              </p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <Link
                  to={`/profile/${comment.userId}`}
                  className="comment-avatar-link"
                >
                  {comment.userProfilePic ? (
                    <img
                      src={toAssetUrl(comment.userProfilePic)}
                      alt={comment.userName || "User"}
                      className="comment-avatar"
                    />
                  ) : (
                    <div className="post-author-pic-placeholder small">
                      {(comment.userName || "U")[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="comment-body">
                  <p className="comment-text">
                    <Link
                      to={`/profile/${comment.userId}`}
                      className="comment-author"
                    >
                      {comment.userName || "Unknown"}
                    </Link>{" "}
                    {comment.content}
                  </p>
                  <div className="comment-meta">
                    <span className="comment-time">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    {auth.userId === comment.userId && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Back to feed */}
        <div className="post-detail-footer">
          <Link to="/" className="btn-secondary">
            &larr; Back to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}

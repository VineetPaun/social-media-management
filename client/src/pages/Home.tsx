import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchPosts,
  deletePost,
  toggleLike,
  toAssetUrl,
  type PostRecord,
  type PaginationData,
  type SignInData,
  ApiClientError,
} from "../api";

// Props interface for Home component
interface HomeProps {
  auth: SignInData | null; // Current user authentication data
  refreshTrigger: number;  // Trigger to refresh posts when changed
}

/**
 * Home component - Main feed page displaying posts with pagination and search
 * Shows posts from all users with like/comment functionality
 */
export function Home({ auth, refreshTrigger }: HomeProps) {
  // Posts and loading state
  const [posts, setPosts] = useState<PostRecord[]>([]);     // Array of posts to display
  const [loading, setLoading] = useState(true);             // Loading state for initial load
  const [error, setError] = useState<string | null>(null);  // Error message display

  // Pagination state
  const [page, setPage] = useState(1);                           // Current page number
  const [pagination, setPagination] = useState<PaginationData | null>(null); // Pagination metadata
  
  // Search functionality state
  const [searchInput, setSearchInput] = useState("");       // Search input field value
  const [activeSearch, setActiveSearch] = useState("");     // Currently active search query

  const navigate = useNavigate();

  // Load posts from API with pagination and search
  // Load posts with pagination and search functionality
  const loadPosts = useCallback(
    async (currentPage: number, search: string) => {
      // Skip if user is not authenticated
      if (!auth?.token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await fetchPosts({
          token: auth.token,
          page: currentPage,
          limit: 10,
          search,
        });
        setPosts(result.data || []);
        setPagination(result.pagination ?? null);
      } catch (err) {
        // Handle and display API errors
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to load posts");
        }
      } finally {
        setLoading(false);
      }
    },
    [auth],
  );

  // Load posts when page, search, or refresh trigger changes
  useEffect(() => {
    loadPosts(page, activeSearch);
  }, [page, activeSearch, refreshTrigger, loadPosts]);

  // Handle search form submission
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page for new search
    setActiveSearch(searchInput);
  };

  // Clear search and reset to all posts
  // Clear search and reset to show all posts
  const handleClearSearch = () => {
    setSearchInput("");
    setPage(1);
    setActiveSearch("");
  };

  // Handle pagination - change page and scroll to top
  // Handle pagination navigation
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle post deletion with confirmation
  // Handle post deletion with confirmation
  const handleDelete = async (postId: string) => {
    if (!auth?.token) return;
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost({ token: auth.token, postId });
      // Remove deleted post from local state
      setPosts(posts.filter((p) => p.id !== postId));
      // Update pagination metadata
      if (pagination) {
        setPagination({
          ...pagination,
          totalPosts: pagination.totalPosts - 1,
          totalPages: Math.ceil((pagination.totalPosts - 1) / pagination.limit),
        });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to delete post");
      }
    }
  };

  // Handle like/unlike toggle for posts
  // Toggle like/unlike status for a post
  const handleLike = async (postId: string) => {
    if (!auth?.token) return;

    try {
      const result = await toggleLike({ token: auth.token, postId });
      // Update post in local state with new like status
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: result.data.liked,
                likeCount: result.data.likeCount,
              }
            : p,
        ),
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      }
    }
  };

  // Navigate to post detail page
  // Navigate to post detail page
  const handleOpenPost = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  // Format timestamp to relative time (e.g., "2h ago")
  // Format timestamp to human-readable relative time
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
  };

  // Render pagination controls with ellipsis for large page counts
  // Render pagination controls with ellipsis for large page counts
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { totalPages, totalPosts } = pagination;
    const pages: (number | string)[] = [];

    // Simple pagination for small page counts
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Complex pagination with ellipsis for large page counts
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="pagination">
        {/* Previous page button */}
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>

        {/* Page number buttons with ellipsis */}
        <div className="pagination-pages">
          {pages.map((p, i) =>
            typeof p === "string" ? (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">
                ...
              </span>
            ) : (
              <button
                key={p}
                className={`pagination-page ${p === page ? "active" : ""}`}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next page button */}
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>

        {/* Total posts count */}
        <span className="pagination-info">
          {totalPosts} post{totalPosts !== 1 ? "s" : ""}
        </span>
      </div>
    );
  };

  return (
    <div className="home">
      {/* Page header with title and create post button */}
      <div className="home-header">
        <h2>Feed</h2>
        {auth && (
          <Link to="/create" className="btn-primary">
            Create Post
          </Link>
        )}
      </div>

      {/* Search bar for authenticated users */}
      {auth && (
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search posts by description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-btn">
            Search
          </button>
          {activeSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </form>
      )}

      {/* Search results info */}
      {auth && activeSearch && !loading && (
        <div className="search-results-info">
          Showing results for "{activeSearch}"
          {pagination ? ` (${pagination.totalPosts} found)` : ""}
        </div>
      )}

      {/* Welcome message for unauthenticated users */}
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

      {/* Loading state */}
      {auth && loading && <div className="feed-status">Loading posts...</div>}

      {/* Error state */}
      {auth && error && <div className="feed-status error">{error}</div>}

      {/* Empty state - no posts found */}
      {auth && !loading && !error && posts.length === 0 && (
        <div className="feed-status">
          {activeSearch
            ? "No posts found matching your search."
            : "No posts yet. Create your first post!"}
        </div>
      )}

      {/* Posts feed and pagination */}
      {auth && !loading && !error && posts.length > 0 && (
        <>
          <div className="posts-feed">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                {/* Post header with author info */}
                <Link to={`/profile/${post.userId}`} className="post-header">
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
                  <span className="post-time">
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </Link>

                {/* Post image - clickable to open post detail */}
                <img
                  src={toAssetUrl(post.image)}
                  alt="Post"
                  className="post-image"
                  onClick={() => handleOpenPost(post.id)}
                  style={{ cursor: "pointer" }}
                />

                {/* Post action buttons (like, comment) */}
                <div className="post-actions">
                  <button
                    className={`post-action-btn like-btn ${post.likedByMe ? "liked" : ""}`}
                    onClick={() => handleLike(post.id)}
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
                  <button
                    className="post-action-btn comment-btn"
                    onClick={() => handleOpenPost(post.id)}
                  >
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

                {/* Like count display */}
                <div className="post-stats">
                  {post.likeCount > 0 && (
                    <span className="post-likes">
                      {post.likeCount} like{post.likeCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Post description */}
                {post.description && (
                  <p className="post-description">
                    <span className="post-description-author">
                      {post.userName || "Unknown"}
                    </span>{" "}
                    {post.description}
                  </p>
                )}

                {/* Comment count and link to view comments */}
                {post.commentCount > 0 && (
                  <button
                    className="post-view-comments"
                    onClick={() => handleOpenPost(post.id)}
                  >
                    View all {post.commentCount} comment
                    {post.commentCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          {renderPagination()}
        </>
      )}
    </div>
  );
}

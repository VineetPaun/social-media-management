import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchProfile,
  deletePost,
  deleteAccount,
  toAssetUrl,
  type UserProfile,
  type SignInData,
  ApiClientError,
} from "../api";

interface ProfileProps {
  auth: SignInData | null;
  onLogout?: () => void;
}

export function Profile({ auth, onLogout }: ProfileProps) {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    useState(false);

  const isOwnProfile = auth?.userId === userId;

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth?.token || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await fetchProfile({ token: auth.token, userId });
        setProfile(result.data);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [auth, userId]);

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
  };

  const confirmDelete = async () => {
    if (!postToDelete || !auth?.token) return;

    try {
      await deletePost({ token: auth.token, postId: postToDelete });
      if (profile) {
        setProfile({
          ...profile,
          posts: profile.posts.filter((p) => p.id !== postToDelete),
          postCount: profile.postCount - 1,
        });
      }
      setPostToDelete(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to delete post");
      }
    }
  };

  const cancelDelete = () => {
    setPostToDelete(null);
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteAccountConfirm(true);
  };

  const cancelDeleteAccount = () => {
    setShowDeleteAccountConfirm(false);
  };

  const confirmDeleteAccount = async () => {
    if (!auth?.token) return;

    try {
      await deleteAccount(auth.token);
      if (onLogout) {
        onLogout();
      }
      // Redirect or UI update will happen via App state change
    } catch (err) {
      if (err instanceof ApiClientError) {
        alert(err.message);
      } else {
        alert("Failed to delete account");
      }
      setShowDeleteAccountConfirm(false);
    }
  };

  if (!auth) {
    return (
      <div className="profile-page">
        <div className="feed-status">
          <p>Please sign in to view profiles.</p>
          <Link to="/signin" className="link">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="feed-status">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="feed-status error">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="feed-status">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {postToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Delete Post</h3>
            <p>Are you sure you want to delete this post?</p>
            <div className="modal-actions">
              <button onClick={cancelDelete} className="modal-btn cancel">
                Cancel
              </button>
              <button onClick={confirmDelete} className="modal-btn confirm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Delete Account</h3>
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={cancelDeleteAccount}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="modal-btn confirm delete-account-confirm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          {profile.profilePic ? (
            <img
              src={toAssetUrl(profile.profilePic)}
              alt={profile.name}
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {profile.name[0].toUpperCase()}
            </div>
          )}
          <div className="profile-info">
            <h2 className="profile-name">{profile.name}</h2>
            <p className="profile-email">{profile.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="stat-value">{profile.postCount}</span>
            <span className="stat-label">Posts</span>
          </div>
        </div>

        {profile.posts.length > 0 && (
          <div className="profile-posts">
            <h3 className="profile-posts-title">Posts</h3>
            <div className="profile-posts-list">
              {profile.posts.map((post) => (
                <div key={post.id} className="profile-post-card">
                  <img
                    src={toAssetUrl(post.image)}
                    alt={post.description || "Post"}
                    className="profile-post-image"
                  />
                  {post.description && (
                    <p className="profile-post-description">
                      {post.description}
                    </p>
                  )}
                  {isOwnProfile && (
                    <div className="profile-post-actions">
                      <button
                        onClick={() => handleDeleteClick(post.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.posts.length === 0 && (
          <div className="profile-no-posts">
            <p>No posts yet</p>
          </div>
        )}

        <div className="profile-actions-footer">
          <Link to="/" className="btn-secondary profile-back">
            ← Back to Feed
          </Link>
          {isOwnProfile && (
            <button
              onClick={handleDeleteAccountClick}
              className="btn-delete-account"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

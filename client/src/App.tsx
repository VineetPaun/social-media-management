import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SignUp } from "./pages/SignUp";
import { SignIn } from "./pages/SignIn";
import { Home } from "./pages/Home";
import { CreatePostPage } from "./pages/CreatePost";
import { Profile } from "./pages/Profile";
import { PostDetail } from "./pages/PostDetail";
import type { SignInData } from "./api";
import "./App.css";

// Local storage key for persisting authentication data
const AUTH_STORAGE_KEY = "social_media_auth";

function App() {
  // Authentication state - stores user data when logged in
  const [auth, setAuth] = useState<SignInData | null>(null);
  // Trigger to refresh posts when new post is created
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load authentication data from localStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setAuth(JSON.parse(stored) as SignInData);
      } catch {
        // Remove corrupted data
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  // Handle successful authentication - save to state and localStorage
  const handleAuthSuccess = (data: SignInData) => {
    setAuth(data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  };

  // Handle user logout - clear state and localStorage
  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  // Trigger refresh of posts list when new post is created
  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <BrowserRouter>
      <div className="app">
        {/* Main navigation header */}
        <header className="app-header">
          <Link to="/" className="logo-link">
            <h1>Instagram</h1>
          </Link>
          <nav className="nav-links">
            {auth ? (
              // Authenticated user navigation
              <>
                <Link to={`/profile/${auth.userId}`} className="nav-link">
                  Profile
                </Link>
                <span className="user-name">Hi, {auth.userName}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              // Guest user navigation
              <>
                <Link to="/signin" className="nav-link">
                  Sign In
                </Link>
                <Link to="/signup" className="nav-link btn-nav-primary">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </header>

        {/* Main content area with routing */}
        <main className="app-main">
          <Routes>
            {/* Home page - shows posts feed */}
            <Route
              path="/"
              element={<Home auth={auth} refreshTrigger={refreshTrigger} />}
            />
            {/* User registration */}
            <Route path="/signup" element={<SignUp />} />
            {/* User login */}
            <Route
              path="/signin"
              element={<SignIn onAuthSuccess={handleAuthSuccess} />}
            />
            {/* Create new post */}
            <Route
              path="/create"
              element={
                <CreatePostPage
                  key={`create-${refreshTrigger}`}
                  auth={auth}
                  onPostCreated={handlePostCreated}
                />
              }
            />
            {/* User profile page */}
            <Route
              path="/profile/:userId"
              element={<Profile auth={auth} onLogout={handleLogout} />}
            />
            {/* Individual post detail page */}
            <Route
              path="/post/:postId"
              element={<PostDetail auth={auth} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

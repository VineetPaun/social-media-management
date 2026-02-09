import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SignUp } from "./pages/SignUp";
import { SignIn } from "./pages/SignIn";
import { Home } from "./pages/Home";
import { CreatePostPage } from "./pages/CreatePost";
import type { SignInData } from "./api";
import "./App.css";

const AUTH_STORAGE_KEY = "social_media_auth";

function App() {
  const [auth, setAuth] = useState<SignInData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setAuth(JSON.parse(stored) as SignInData);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const handleAuthSuccess = (data: SignInData) => {
    setAuth(data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="logo-link">
            <h1>Instagram</h1>
          </Link>
          <nav className="nav-links">
            {auth ? (
              <>
                <span className="user-name">Hi, {auth.userName}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
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

        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  auth={auth}
                  onPostDeleted={handlePostCreated}
                  refreshTrigger={refreshTrigger}
                />
              }
            />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/signin"
              element={<SignIn onAuthSuccess={handleAuthSuccess} />}
            />
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

import { useState, useRef, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, ApiClientError } from "../api";

export function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const profilePicFile = fileInputRef.current?.files?.[0];

    try {
      await signup({ name, email, password, profilePicFile });
      alert("Account created! Please sign in.");
      navigate("/signin");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group profile-pic-group">
            <label htmlFor="profilePic">Profile Picture</label>
            <div className="profile-pic-upload">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="profile-pic-preview"
                />
              ) : (
                <div className="profile-pic-placeholder">
                  <span>📷</span>
                </div>
              )}
              <input
                id="profilePic"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="profile-pic-input"
              />
              <label htmlFor="profilePic" className="profile-pic-label">
                Choose Photo
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-toggle">
          Already have an account?{" "}
          <Link to="/signin" className="link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

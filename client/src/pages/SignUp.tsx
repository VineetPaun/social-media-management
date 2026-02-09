import { useState, useRef, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, ApiClientError } from "../api";

// SignUp component for user registration
/**
 * SignUp component - User registration form
 * Handles new user account creation with optional profile picture
 */
export function SignUp() {
  const navigate = useNavigate();
  // Form state
  const [name, setName] = useState("");                      // Name input value
  const [email, setEmail] = useState("");                    // Email input value
  const [password, setPassword] = useState("");              // Password input value
  const [error, setError] = useState<string | null>(null);   // Error message display
  const [loading, setLoading] = useState(false);             // Loading state during submission
  const [preview, setPreview] = useState<string | null>(null); // Profile picture preview
  const fileInputRef = useRef<HTMLInputElement>(null);       // Reference to file input element

  // Handle profile picture file selection and generate preview
  // Handle profile picture file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file); // Convert to base64 for preview
    } else {
      setPreview(null);
    }
  };

  // Handle form submission for user registration
  // Handle form submission for user registration
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Get selected profile picture file (optional)
    const profilePicFile = fileInputRef.current?.files?.[0];

    try {
      await signup({ name, email, password, profilePicFile });
      alert("Account created! Please sign in.");
      navigate("/signin"); // Redirect to signin page
    } catch (err) {
      // Handle and display errors
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
          {/* Profile picture upload section */}
          <div className="form-group profile-pic-group">
            <label htmlFor="profilePic">Profile Picture</label>
            <div className="profile-pic-upload">
              {/* Show preview or placeholder */}
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
              {/* Hidden file input */}
              <input
                id="profilePic"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="profile-pic-input"
              />
              {/* Custom file input label */}
              <label htmlFor="profilePic" className="profile-pic-label">
                Choose Photo
              </label>
            </div>
          </div>

          {/* Name input field */}
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

          {/* Email input field */}
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

          {/* Password input field */}
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

          {/* Error message display */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit button */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {/* Link to signin page */}
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

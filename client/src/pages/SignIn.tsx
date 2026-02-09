import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signin,
  type AuthPayload,
  type SignInData,
  ApiClientError,
} from "../api";

// Props interface for SignIn component
interface SignInProps {
  onAuthSuccess: (data: SignInData) => void; // Callback when signin is successful
}

/**
 * SignIn component - User authentication form
 * Handles user login with email and password validation
 */
export function SignIn({ onAuthSuccess }: SignInProps) {
  const navigate = useNavigate();
  // Form state
  const [email, setEmail] = useState("");                    // Email input value
  const [password, setPassword] = useState("");              // Password input value
  const [error, setError] = useState<string | null>(null);   // Error message display
  const [loading, setLoading] = useState(false);             // Loading state during submission

  // Handle form submission for user signin
  // Handle form submission for user authentication
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Create auth payload (name is empty for signin)
    const payload: AuthPayload = { name: "", email, password };

    try {
      const result = await signin(payload);
      // Notify parent component of successful authentication
      onAuthSuccess(result.data);
      navigate("/"); // Redirect to home page
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
        <h2 className="auth-title">Welcome Back</h2>

        <form onSubmit={handleSubmit} className="auth-form">
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Link to signup page */}
        <p className="auth-toggle">
          Don't have an account?{" "}
          <Link to="/signup" className="link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

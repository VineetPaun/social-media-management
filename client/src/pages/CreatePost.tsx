import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createPost, type SignInData, ApiClientError } from "../api";

// Props interface for CreatePostPage component
interface CreatePostPageProps {
  auth: SignInData | null;  // Current user authentication data
  onPostCreated: () => void; // Callback when post is successfully created
}

export function CreatePostPage({ auth, onPostCreated }: CreatePostPageProps) {
  const navigate = useNavigate();
  // Form state
  const [description, setDescription] = useState("");  // Post description/caption
  const [loading, setLoading] = useState(false);       // Loading state during submission
  const [error, setError] = useState<string | null>(null); // Error message display
  const [preview, setPreview] = useState<string | null>(null); // Image preview URL
  const fileInputRef = useRef<HTMLInputElement>(null); // Reference to file input element

  // Redirect to signin if user is not authenticated
  if (!auth) {
    navigate("/signin");
    return null;
  }

  // Handle file selection and generate preview
  // Handle file selection and generate preview
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

  // Handle form submission to create post
  // Handle form submission for creating a new post
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that an image is selected
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please select an image");
      return;
    }

    setLoading(true);

    try {
      // Create the post via API
      await createPost({ description, imageFile: file, token: auth.token });

      // Reset form state for creating another post
      setDescription("");
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component and navigate to home
      // Notify parent component and navigate back to home
      onPostCreated();
      navigate("/");
    } catch (err) {
      // Handle and display errors
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to create post");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <div className="create-post-card">
        <h2>Create New Post</h2>
        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Image upload section */}
          <div className="form-group">
            <label htmlFor="image">Image *</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              required
            />
            {/* Show image preview if available */}
            {preview && (
              <img src={preview} alt="Preview" className="image-preview" />
            )}
          </div>

          {/* Description input section */}
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a description..."
              rows={4}
            />
          </div>

          {/* Error message display */}
          {error && <div className="error-message">{error}</div>}

          {/* Form action buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

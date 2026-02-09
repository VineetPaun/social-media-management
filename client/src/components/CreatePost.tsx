import { useState, useRef, type FormEvent } from "react";
import { createPost, ApiClientError } from "../api";

interface CreatePostProps {
  token: string;
  onPostCreated: () => void;
}

export function CreatePost({ token, onPostCreated }: CreatePostProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please select an image");
      return;
    }

    setLoading(true);

    try {
      await createPost({ description, imageFile: file, token });
      setDescription("");
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onPostCreated();
    } catch (err) {
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
    <div className="create-post">
      <h3>Create New Post</h3>
      <form onSubmit={handleSubmit} className="create-post-form">
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
          {preview && (
            <img src={preview} alt="Preview" className="image-preview" />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a description..."
            rows={3}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Post"}
        </button>
      </form>
    </div>
  );
}

// Default API base URL for local development
const DEFAULT_API_BASE_URL = "http://localhost:3000";
// Get API base URL from environment variables
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Use environment API URL if available, otherwise fallback to default
const API_BASE_URL =
  typeof envApiBaseUrl === "string" && envApiBaseUrl.trim().length > 0
    ? envApiBaseUrl.replace(/\/+$/, "") // Remove trailing slashes
    : DEFAULT_API_BASE_URL;

// Type for API field validation errors
type ApiFieldError = {
  field?: string;   // Field name that has the error
  message?: string; // Error message for the field
};

// Generic API response wrapper structure
type ApiResponseEnvelope<T> = {
  message?: string;           // Response message from server
  data?: T;                  // Actual response data
  errors?: ApiFieldError[];  // Validation or other errors
  pagination?: PaginationData; // Pagination metadata for lists
};

// Processed API result after parsing response
type ApiResult<T> = {
  data: T;                    // Response data
  message: string;            // Success message
  pagination?: PaginationData; // Optional pagination info
};

// Authentication payload for signup/signin requests
type AuthPayload = {
  name: string;     // User's full name
  email: string;    // User's email address
  password: string; // User's password
};

// Response data structure for successful signup
type SignUpData = {
  userId: string;              // Unique user identifier
  userName: string;            // User's display name
  email: string;               // User's email address
  profilePic: string | null;   // Profile picture URL or null
};

// Response data structure for successful signin
type SignInData = {
  userId: string;              // Unique user identifier
  userName: string;            // User's display name
  token: string;               // JWT authentication token
  profilePic?: string | null;  // Optional profile picture URL
};

// Post data structure with user and engagement info
type PostRecord = {
  id: string;                    // Unique post identifier
  userId: string;                // ID of user who created the post
  description: string | null;    // Optional post description/caption
  image: string;                 // Post image URL
  userName: string | null;       // Display name of post author
  userProfilePic: string | null; // Profile picture of post author
  createdAt: string;             // Post creation timestamp
  likeCount: number;             // Total number of likes
  commentCount: number;          // Total number of comments
  likedByMe: boolean;            // Whether current user liked this post
};

// Pagination metadata for paginated API responses
type PaginationData = {
  page: number;       // Current page number
  limit: number;      // Items per page
  totalPosts: number; // Total number of posts
  totalPages: number; // Total number of pages
};

// User profile data structure with posts
type UserProfile = {
  id: string;                // Unique user identifier
  name: string;              // User's display name
  email: string;             // User's email address
  profilePic: string | null; // Profile picture URL or null
  postCount: number;         // Total number of user's posts
  posts: {                   // Array of user's posts
    id: string;                // Post ID
    description: string | null; // Post description
    image: string;             // Post image URL
  }[];
};

// Comment data structure with user info
type CommentRecord = {
  id: string;                    // Unique comment identifier
  content: string;               // Comment text content
  createdAt: string;             // Comment creation timestamp
  userId: string;                // ID of user who wrote the comment
  userName: string | null;       // Display name of comment author
  userProfilePic: string | null; // Profile picture of comment author
};

// Result of like/unlike toggle operation
type LikeToggleResult = {
  liked: boolean;     // Whether post is now liked by user
  likeCount: number;  // Updated total like count
};

// Custom error class for API client errors
class ApiClientError extends Error {
  statusCode: number;           // HTTP status code
  fieldErrors: ApiFieldError[]; // Field-specific validation errors

  constructor(
    message: string,
    statusCode: number,
    fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

// Type guard to check if value is a record/object
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// Parse response body as JSON or return as text
const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  // Return null for empty responses
  if (text.length === 0) {
    return null;
  }

  // Try to parse as JSON, fallback to text
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

// Extract field errors from API response payload
const extractFieldErrors = (payload: unknown): ApiFieldError[] => {
  if (!isRecord(payload) || !Array.isArray(payload.errors)) {
    return [];
  }

  // Filter and map errors to proper format
  return payload.errors
    .filter((item): item is ApiFieldError => isRecord(item))
    .map((item) => ({
      field: typeof item.field === "string" ? item.field : undefined,
      message: typeof item.message === "string" ? item.message : undefined,
    }));
};

// Extract error message from API response with fallbacks
const extractErrorMessage = (
  payload: unknown,
  fallbackStatusText: string,
  fieldErrors: ApiFieldError[],
): string => {
  // Use message from payload if available
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  // Use payload as string if it's a string
  if (typeof payload === "string") {
    return payload;
  }

  // Combine field error messages
  const mappedFieldMessages = fieldErrors
    .map((item) => item.message)
    .filter((message): message is string => typeof message === "string");

  if (mappedFieldMessages.length > 0) {
    return mappedFieldMessages.join(" ");
  }

  // Final fallback
  return fallbackStatusText.length > 0 ? fallbackStatusText : "Request failed";
};

// Resolve relative API path to full URL
const resolvePath = (path: string): string =>
  path.startsWith("/") ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;

// Generic HTTP request function with error handling
const request = async <T>(
  path: string,
  init: RequestInit,
): Promise<ApiResult<T>> => {
  const response = await fetch(resolvePath(path), init);
  const payload = await parseBody(response);

  // Handle error responses
  if (!response.ok) {
    const fieldErrors = extractFieldErrors(payload);
    const message = extractErrorMessage(
      payload,
      response.statusText,
      fieldErrors,
    );
    throw new ApiClientError(message, response.status, fieldErrors);
  }

  // Handle structured API responses
  if (isRecord(payload)) {
    const envelope = payload as ApiResponseEnvelope<T>;
    const message =
      typeof envelope.message === "string" && envelope.message.length > 0
        ? envelope.message
        : "Request completed";
    const data = (envelope.data ?? null) as T;
    const pagination = envelope.pagination;
    return { data, message, pagination };
  }

  // Handle plain responses
  return { data: payload as T, message: "Request completed" };
};

// Create authorization headers with Bearer token
const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

// User signup with optional profile picture
const signup = ({
  name,
  email,
  password,
  profilePicFile,
}: {
  name: string;
  email: string;
  password: string;
  profilePicFile?: File;
}) => {
  // Create form data for multipart upload
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("password", password);
  if (profilePicFile) {
    formData.append("profilePic", profilePicFile);
  }

  return request<SignUpData>("/user/signup", {
    method: "POST",
    body: formData,
  });
};

// User signin with email and password
const signin = (payload: AuthPayload) =>
  request<SignInData>("/user/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

// Fetch paginated posts with optional search
const fetchPosts = ({
  token,
  page = 1,
  limit = 10,
  search = "",
}: {
  token: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  // Build query parameters
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search.trim().length > 0) {
    params.set("search", search.trim());
  }

  return request<PostRecord[]>(`/post?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });
};

// Create new post with image and optional description
const createPost = ({
  description,
  imageFile,
  token,
}: {
  description: string;
  imageFile: File;
  token: string;
}) => {
  // Create form data for image upload
  const formData = new FormData();
  formData.append("image", imageFile);

  // Add description if provided
  const trimmedDescription = description.trim();
  if (trimmedDescription.length > 0) {
    formData.append("description", trimmedDescription);
  }

  return request<{ image: string | null }>("/post/create", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
};

// Delete a post by ID
const deletePost = ({ token, postId }: { token: string; postId: string }) => {
  console.log("API deletePost called with postId:", postId);
  console.log("Token present:", !!token);
  return request<{ postId: string }>(`/post/${postId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};

// Delete user account
const deleteAccount = (token: string) =>
  request(`/user/delete`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

// Convert relative image path to full asset URL
const toAssetUrl = (imagePath: string): string => {
  // Return as-is if already a full URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Prepend API base URL to relative paths
  return imagePath.startsWith("/")
    ? `${API_BASE_URL}${imagePath}`
    : `${API_BASE_URL}/${imagePath}`;
};

// Fetch user profile by user ID
const fetchProfile = ({ token, userId }: { token: string; userId: string }) =>
  request<UserProfile>(`/user/profile/${userId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

// Fetch single post by ID
const fetchPost = ({ token, postId }: { token: string; postId: string }) =>
  request<PostRecord>(`/post/${postId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

// Toggle like/unlike on a post
const toggleLike = ({ token, postId }: { token: string; postId: string }) =>
  request<LikeToggleResult>(`/post/${postId}/like`, {
    method: "POST",
    headers: authHeaders(token),
  });

// Create a new comment on a post
const createComment = ({
  token,
  postId,
  content,
}: {
  token: string;
  postId: string;
  content: string;
}) =>
  request<CommentRecord>(`/post/${postId}/comments`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

// Fetch paginated comments for a post
const fetchComments = ({
  token,
  postId,
  page = 1,
  limit = 50,
}: {
  token: string;
  postId: string;
  page?: number;
  limit?: number;
}) => {
  // Build pagination parameters
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  return request<CommentRecord[]>(`/post/${postId}/comments?${params.toString()}`, {
    method: "GET",
    headers: authHeaders(token),
  });
};

// Delete a comment by ID
const deleteComment = ({
  token,
  commentId,
}: {
  token: string;
  commentId: string;
}) =>
  request<{ commentId: string }>(`/post/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export type {
  ApiFieldError,
  AuthPayload,
  CommentRecord,
  LikeToggleResult,
  PaginationData,
  PostRecord,
  SignInData,
  SignUpData,
  UserProfile,
};
export {
  API_BASE_URL,
  ApiClientError,
  createComment,
  createPost,
  deleteAccount,
  deleteComment,
  deletePost,
  fetchComments,
  fetchPost,
  fetchPosts,
  fetchProfile,
  signin,
  signup,
  toAssetUrl,
  toggleLike,
};

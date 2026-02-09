const DEFAULT_API_BASE_URL = "http://localhost:3000";
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL =
  typeof envApiBaseUrl === "string" && envApiBaseUrl.trim().length > 0
    ? envApiBaseUrl.replace(/\/+$/, "")
    : DEFAULT_API_BASE_URL;

type ApiFieldError = {
  field?: string;
  message?: string;
};

type ApiResponseEnvelope<T> = {
  message?: string;
  data?: T;
  errors?: ApiFieldError[];
};

type ApiResult<T> = {
  data: T;
  message: string;
};

type AuthPayload = {
  name: string;
  email: string;
  password: string;
};

type SignUpData = {
  userId: string;
  userName: string;
  email: string;
  profilePic: string | null;
};

type SignInData = {
  userId: string;
  userName: string;
  token: string;
  profilePic?: string | null;
};

type PostRecord = {
  id: string;
  userId: string;
  description: string | null;
  image: string;
  userName: string | null;
  userProfilePic: string | null;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  profilePic: string | null;
  postCount: number;
  posts: {
    id: string;
    description: string | null;
    image: string;
  }[];
};

class ApiClientError extends Error {
  statusCode: number;
  fieldErrors: ApiFieldError[];

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const extractFieldErrors = (payload: unknown): ApiFieldError[] => {
  if (!isRecord(payload) || !Array.isArray(payload.errors)) {
    return [];
  }

  return payload.errors
    .filter((item): item is ApiFieldError => isRecord(item))
    .map((item) => ({
      field: typeof item.field === "string" ? item.field : undefined,
      message: typeof item.message === "string" ? item.message : undefined,
    }));
};

const extractErrorMessage = (
  payload: unknown,
  fallbackStatusText: string,
  fieldErrors: ApiFieldError[],
): string => {
  if (isRecord(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload === "string") {
    return payload;
  }

  const mappedFieldMessages = fieldErrors
    .map((item) => item.message)
    .filter((message): message is string => typeof message === "string");

  if (mappedFieldMessages.length > 0) {
    return mappedFieldMessages.join(" ");
  }

  return fallbackStatusText.length > 0 ? fallbackStatusText : "Request failed";
};

const resolvePath = (path: string): string =>
  path.startsWith("/") ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;

const request = async <T>(
  path: string,
  init: RequestInit,
): Promise<ApiResult<T>> => {
  const response = await fetch(resolvePath(path), init);
  const payload = await parseBody(response);

  if (!response.ok) {
    const fieldErrors = extractFieldErrors(payload);
    const message = extractErrorMessage(
      payload,
      response.statusText,
      fieldErrors,
    );
    throw new ApiClientError(message, response.status, fieldErrors);
  }

  if (isRecord(payload)) {
    const envelope = payload as ApiResponseEnvelope<T>;
    const message =
      typeof envelope.message === "string" && envelope.message.length > 0
        ? envelope.message
        : "Request completed";
    const data = (envelope.data ?? null) as T;
    return { data, message };
  }

  return { data: payload as T, message: "Request completed" };
};

const authHeaders = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
});

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

const signin = (payload: AuthPayload) =>
  request<SignInData>("/user/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

const fetchPosts = (token: string) =>
  request<PostRecord[]>("/post", {
    method: "GET",
    headers: authHeaders(token),
  });

const createPost = ({
  description,
  imageFile,
  token,
}: {
  description: string;
  imageFile: File;
  token: string;
}) => {
  const formData = new FormData();
  formData.append("image", imageFile);

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

const deletePost = ({ token, postId }: { token: string; postId: string }) => {
  console.log("API deletePost called with postId:", postId);
  console.log("Token present:", !!token);
  return request<{ postId: string }>(`/post/${postId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
};

const deleteAccount = (token: string) =>
  request(`/user/delete`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

const toAssetUrl = (imagePath: string): string => {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return imagePath.startsWith("/")
    ? `${API_BASE_URL}${imagePath}`
    : `${API_BASE_URL}/${imagePath}`;
};

const fetchProfile = ({ token, userId }: { token: string; userId: string }) =>
  request<UserProfile>(`/user/profile/${userId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

export type {
  ApiFieldError,
  AuthPayload,
  PostRecord,
  SignInData,
  SignUpData,
  UserProfile,
};
export {
  API_BASE_URL,
  ApiClientError,
  createPost,
  deletePost,
  fetchPosts,
  fetchProfile,
  signin,
  signup,
  toAssetUrl,
  deleteAccount,
};

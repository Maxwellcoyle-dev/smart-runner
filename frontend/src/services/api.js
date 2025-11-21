import { API_BASE_URL } from "../constants/config";

/**
 * Get authentication headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Base API fetch wrapper with error handling and authentication
 */
const apiFetch = async (endpoint, options = {}) => {
  try {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    };

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    // Debug logging in production to help troubleshoot
    if (window.location.hostname.includes("vercel")) {
      console.log(`[apiFetch] Calling: ${fullUrl}`);
      console.log(`[apiFetch] API_BASE_URL: ${API_BASE_URL}`);
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Authentication required. Please login again.");
    }

    // Check if response is actually JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Backend not responding correctly. Got HTML instead of JSON. ` +
          `Make sure the backend is running on port 3000 and the React dev server has been restarted after adding the proxy. ` +
          `Response: ${text.substring(0, 100)}`
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export default apiFetch;
export { getAuthHeaders };


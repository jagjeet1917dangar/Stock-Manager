// Helper to get headers with User ID
export const getHeaders = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  return {
    "Content-Type": "application/json",
    "x-user-id": user?.id || ""
  };
};

// Helper for fetches
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  return fetch(url, { ...options, headers });
};
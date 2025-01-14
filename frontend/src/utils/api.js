import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // Backend API URL
});

// Attach token to requests if available
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Handle responses and refresh token if needed
export const setupInterceptors = (refreshAccessToken, clearAuthData) => {
  api.interceptors.request.use(
    (config) => {
      // Authorization header is already handled via setAuthToken
      return config;
    },
    (error) => {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        // Attempt to refresh token
        try {
          await refreshAccessToken();
          return api.request(error.config); // Retry the original request
        } catch (err) {
          console.error("Token refresh failed:", err);
          clearAuthData(); // Log out the user
          return Promise.reject(err);
        }
      } else {
        console.error("API response error:", error);
      }

      return Promise.reject(error);
    }
  );
};

// Add a function to edit consumption entries
export const editConsumptionEntry = async (entryId, updatedData) => {
  try {
    const response = await api.put(`/consumption/${entryId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Failed to edit consumption entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// Add a function to delete consumption entries
export const deleteConsumptionEntry = async (entryId) => {
  try {
    const response = await api.delete(`/consumption/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete consumption entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// Add a function to edit spending entries
export const editSpendingEntry = async (entryId, updatedData) => {
  try {
    const response = await api.put(`/spending/${entryId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Failed to edit spending entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// Add a function to delete spending entries
export const deleteSpendingEntry = async (entryId) => {
  try {
    const response = await api.delete(`/spending/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete spending entry (ID: ${entryId}):`, error);
    throw error;
  }
};

export default api;

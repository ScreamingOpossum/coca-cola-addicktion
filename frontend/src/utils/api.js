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
export const setupInterceptors = (refreshAccessToken, clearAuthData, navigate) => {
  api.interceptors.request.use(
    (config) => config,
    (error) => {
      console.error("Request error:", error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        const originalRequest = error.config;

        if (error.response.data?.detail === "Token expired") {
          try {
            await refreshAccessToken();
            return api.request(originalRequest);
          } catch (err) {
            console.error("Token refresh failed. Logging out...");
            clearAuthData();
            navigate("/login");
            return Promise.reject(err);
          }
        }
      } else {
        console.error("API response error:", error);
      }
      return Promise.reject(error);
    }
  );
};

// ------------------------------
// Analytics API Calls
// ------------------------------

// Fetch daily trends for consumption
export const getDailyTrends = async (userId) => {
  try {
    const response = await api.get("/analytics/daily-trends", { params: { user_id: userId } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch daily trends:", error);
    throw error;
  }
};

// Compare selected months for consumption and spending
export const compareMonths = async (userId, months) => {
  try {
    const response = await api.get("/analytics/compare-months", { params: { user_id: userId, months } });
    return response.data;
  } catch (error) {
    console.error("Failed to compare months:", error);
    throw error;
  }
};

// Get weekly overview (consumption & spending)
export const getWeeklyOverview = async (userId) => {
  try {
    const response = await api.get("/analytics/weekly-overview", { params: { user_id: userId } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch weekly overview:", error);
    throw error;
  }
};

// Fetch daily consumption for a selected month
export const getMonthlyTrends = async (userId, month) => {
  try {
    const response = await api.get("/analytics/monthly-trends", { params: { user_id: userId, month } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch monthly trends:", error);
    throw error;
  }
};

// Get annual consumption & spending overview
export const getAnnualOverview = async (userId, year) => {
  try {
    const response = await api.get("/analytics/annual-overview", { params: { user_id: userId, year } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch annual overview:", error);
    throw error;
  }
};

// Fetch spending distribution by store or city
export const getSpendingByCategory = async (userId, groupBy) => {
  try {
    const response = await api.get("/analytics/spending-category", { params: { user_id: userId, group_by: groupBy } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch spending by category:", error);
    throw error;
  }
};

// Fetch top 5 consumption or spending days
export const getTopDays = async (userId, type) => {
  try {
    const response = await api.get("/analytics/top-days", { params: { user_id: userId, type } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch top days:", error);
    throw error;
  }
};

// Fetch user milestones (e.g., "First 100 Liters")
export const getMilestones = async (userId) => {
  try {
    const response = await api.get("/analytics/milestones", { params: { user_id: userId } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch milestones:", error);
    throw error;
  }
};

// Fetch monthly spending as a percentage of user income
export const getSpendingPercentage = async (userId) => {
  try {
    const response = await api.get("/analytics/spending-percentage", { params: { user_id: userId } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch spending percentage:", error);
    throw error;
  }
};

// ------------------------------
// Consumption & Spending Management
// ------------------------------

// Edit consumption entry
export const editConsumptionEntry = async (entryId, updatedData) => {
  try {
    const response = await api.put(`/consumption/${entryId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Failed to edit consumption entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// Delete consumption entry
export const deleteConsumptionEntry = async (entryId) => {
  try {
    const response = await api.delete(`/consumption/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete consumption entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// Edit spending entry
export const editSpendingEntry = async (entryId, updatedData) => {
  try {
    const response = await api.put(`/spending/${entryId}`, updatedData);
    return response.data;
  } catch (error) {
    console.error(`Failed to edit spending entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// Delete spending entry
export const deleteSpendingEntry = async (entryId) => {
  try {
    const response = await api.delete(`/spending/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete spending entry (ID: ${entryId}):`, error);
    throw error;
  }
};

// User deletion
export const deleteUser = async () => {
  try {
    const response = await api.delete("/user");
    return response.data;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw error;
  }
};

export default api;

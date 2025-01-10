import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Toolbar,
  useTheme,
  Alert,
} from "@mui/material";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [todayConsumption, setTodayConsumption] = useState(0);
  const [weeklyConsumption, setWeeklyConsumption] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [highestConsumption, setHighestConsumption] = useState({
    date: null,
    liters: 0,
  });
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Handle missing token
      if (!token) {
        setError("Authentication token is missing. Please log in.");
        navigate("/login");
        return;
      }

      // Fetch dashboard data from the backend
      const response = await axios.get("http://127.0.0.1:8000/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      // Update state with fetched data
      setTodayConsumption(data.todayConsumption || 0);
      setWeeklyConsumption(data.weeklyConsumption || 0);
      setMonthlyAverage(data.monthlyAverage || 0);
      setTotalConsumption(data.totalConsumption || 0);

      setHighestConsumption(
  data.highestConsumption?.liters
    ? {
        liters: data.highestConsumption.liters,
        date: data.highestConsumption.date || "N/A",
      }
    : { liters: 0, date: "N/A" }
    );

      setWeeklyTrends(
  data.weeklyTrends?.map((trend) => ({
    ...trend,
    liters: trend.liters || 0,
  })) || []
  );

      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching dashboard data:", err);

      // Handle errors and update state accordingly
      setError(
        err.response?.data?.detail || "Failed to fetch dashboard data. Please try again later."
      );

      // If unauthorized, clear token and redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false); // Stop loading indicator
    }
  }, [navigate]);

  // Use useEffect to fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        marginLeft: "250px",
        minHeight: "100vh",
        overflowY: "auto",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Display error alert if an error occurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Show loading indicator */}
      {loading ? (
        <Typography variant="h6" align="center">
          Loading dashboard data...
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Dashboard metrics */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6">Today’s Consumption</Typography>
                <Typography variant="h4" color="primary">
                  {todayConsumption.toFixed(2)} L
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6">Weekly Consumption</Typography>
                <Typography variant="h4" color="primary">
                  {weeklyConsumption.toFixed(2)} L
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6">Monthly Average</Typography>
                <Typography variant="h4" color="primary">
                  {monthlyAverage.toFixed(2)} L
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6">Total Consumption</Typography>
                <Typography variant="h4" color="primary">
                  {totalConsumption.toFixed(2)} L
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6">Highest Consumption</Typography>
                <Typography variant="body1">
                  {highestConsumption.liters
                    ? `${highestConsumption.liters.toFixed(2)} L on ${highestConsumption.date}`
                    : "N/A"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Weekly Trends */}
          <Grid item xs={12}>
            <Card elevation={4}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Trends
                </Typography>
                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                    padding: 2,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrends}>
                      <Line
                        type="monotone"
                        dataKey="liters"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                      />
                      <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

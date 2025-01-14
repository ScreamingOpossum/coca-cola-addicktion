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
  const theme = useTheme(); // Access theme for consistent styling
  const navigate = useNavigate(); // Navigation hook for redirecting

  // State variables to store dashboard metrics
  const [todayConsumption, setTodayConsumption] = useState(0);
  const [weeklyConsumption, setWeeklyConsumption] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [yearlyConsumption, setYearlyConsumption] = useState(0);
  const [highestConsumption, setHighestConsumption] = useState({
    date: "N/A",
    liters: 0,
  });

  const [todaySpending, setTodaySpending] = useState(0);
  const [weeklySpending, setWeeklySpending] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [yearlySpending, setYearlySpending] = useState(0);
  const [highestSpending, setHighestSpending] = useState({
    date: "N/A",
    amount: 0,
  });

  const [spendingPercentage, setSpendingPercentage] = useState(null); // New percentage state
  const [weeklyTrends, setWeeklyTrends] = useState([]); // Weekly trends data for charts
  const [error, setError] = useState(null); // To handle errors
  const [loading, setLoading] = useState(true); // To manage loading state

  // Fetch dashboard data from the API
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Retrieve token from localStorage

      // Redirect to login if no token is found
      if (!token) {
        setError("Authentication token is missing. Please log in.");
        navigate("/login");
        return;
      }

      // Fetch dashboard metrics from the API
      const response = await axios.get("http://127.0.0.1:8000/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      });

      const data = response.data;

      // Log response for debugging
      console.log("Dashboard data:", data);

      // Update state variables with fetched data
      setTodayConsumption(data.todayConsumption || 0);
      setWeeklyConsumption(data.weeklyConsumption || 0);
      setMonthlyAverage(data.monthlyAverage || 0);
      setYearlyConsumption(data.yearlyConsumption || 0);

      setHighestConsumption({
        liters: data.highestConsumption?.liters || 0,
        date: data.highestConsumption?.date || "N/A",
      });

      setTodaySpending(data.todaySpending || 0);
      setWeeklySpending(data.weeklySpending || 0);
      setMonthlySpending(data.monthlySpending || 0);
      setYearlySpending(data.yearlySpending || 0);

      setHighestSpending({
        amount: data.highestSpending?.amount || 0,
        date: data.highestSpending?.date || "N/A",
      });

      // Ensure valid percentage data
      const percentage =
        data.spending_percentage && data.spending_percentage > 0
          ? data.spending_percentage
          : null;

      setSpendingPercentage(percentage);

      setWeeklyTrends(data.weeklyTrends || []);

      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch dashboard data. Please try again later.");

      // Redirect to login if unauthorized
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false); // Stop loading state
    }
  }, [navigate]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        marginLeft: "250px", // Account for sidebar width
        minHeight: "100vh",
        overflowY: "auto",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Display error if any */}
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
        <>
          {/* Consumption Metrics */}
          <Grid container spacing={3}>
            {/* Consumption Row */}
            <Grid item xs={12} container spacing={3}>
              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Today’s Consumption</Typography>
                    <Typography variant="h4" color="primary">
                      {todayConsumption.toFixed(2)} L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Weekly Consumption</Typography>
                    <Typography variant="h4" color="primary">
                      {weeklyConsumption.toFixed(2)} L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Average Consumption</Typography>
                    <Typography variant="h4" color="primary">
                      {monthlyAverage.toFixed(2)} L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Yearly Consumption</Typography>
                    <Typography variant="h4" color="primary">
                      {yearlyConsumption.toFixed(2)} L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Spending Metrics */}
            <Grid item xs={12} container spacing={3}>
              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Today’s Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      {todaySpending.toFixed(2)} Br
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Weekly Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      {weeklySpending.toFixed(2)} Br
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Monthly Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      {monthlySpending.toFixed(2)} Br
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Yearly Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      {yearlySpending.toFixed(2)} Br
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Highest Records and Spending % */}
            <Grid item xs={12} container spacing={3}>
              <Grid item xs={4}>
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

              <Grid item xs={4}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Highest Spending</Typography>
                    <Typography variant="body1">
                      {highestSpending.amount
                        ? `${highestSpending.amount.toFixed(2)} Br on ${highestSpending.date}`
                        : "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={4}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Monthly % of Income</Typography>
                    <Typography variant="h4" style={{ color: "#3f51b5" }}>
                      {spendingPercentage !== null
                        ? `${spendingPercentage.toFixed(2)}%`
                        : "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Weekly Trends Chart */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Weekly Trends (Consumption vs Spending)
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
                        <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
                        <XAxis dataKey="name" />
                        <YAxis
                          yAxisId="left"
                          label={{
                            value: "Liters",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          label={{
                            value: "Br Spent",
                            angle: -90,
                            position: "insideRight",
                          }}
                        />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="liters"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="amount"
                          stroke={theme.palette.secondary.main}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

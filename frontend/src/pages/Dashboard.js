import React, { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom"; // For navigation

export default function Dashboard() {
  const theme = useTheme(); // Material-UI Theme for dynamic styling
  const navigate = useNavigate(); // For redirecting to login if unauthorized

  // State for metrics and chart data
  const [todayConsumption, setTodayConsumption] = useState(0);
  const [weeklyConsumption, setWeeklyConsumption] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [error, setError] = useState(null); // For error messages

  // Fetch data from the API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          navigate("/login"); // Redirect to login page
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        setTodayConsumption(data.todayConsumption);
        setWeeklyConsumption(data.weeklyConsumption);
        setMonthlyAverage(data.monthlyAverage);
        setTotalSpending(data.totalSpending);
        setWeeklyTrends(data.weeklyTrends);
        setError(null); // Clear any previous error
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err.response?.data?.detail || "Failed to fetch dashboard data."
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token"); // Clear invalid token
          navigate("/login"); // Redirect to login
        }
      }
    };

    fetchDashboardData();
  }, [navigate]);

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Today’s Consumption */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Today’s Consumption</Typography>
              <Typography variant="h4" color="primary">
                {todayConsumption} L
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Consumption */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Weekly Consumption</Typography>
              <Typography variant="h4" color="primary">
                {weeklyConsumption} L
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Average */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Monthly Average</Typography>
              <Typography variant="h4" color="primary">
                {monthlyAverage} L
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Spending */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Total Spending</Typography>
              <Typography variant="h4" color="primary">
                ${totalSpending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Trends Chart */}
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
    </Box>
  );
}

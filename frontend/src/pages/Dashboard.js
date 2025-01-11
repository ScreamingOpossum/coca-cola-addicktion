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
  const [todaySpending, setTodaySpending] = useState(0);
  const [weeklySpending, setWeeklySpending] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);
  const [highestSpending, setHighestSpending] = useState({
    date: null,
    amount: 0,
  });
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        navigate("/login");
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

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

      setTodaySpending(data.todaySpending || 0);
      setWeeklySpending(data.weeklySpending || 0);
      setMonthlySpending(data.monthlySpending || 0);
      setTotalSpending(data.totalSpending || 0);
      setHighestSpending(
        data.highestSpending?.amount
          ? {
              amount: data.highestSpending.amount,
              date: data.highestSpending.date || "N/A",
            }
          : { amount: 0, date: "N/A" }
      );

      setWeeklyTrends(data.weeklyTrends || []);

      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err.response?.data?.detail || "Failed to fetch dashboard data. Please try again later."
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography variant="h6" align="center">
          Loading dashboard data...
        </Typography>
      ) : (
        <>
          <Grid container spacing={3}>
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
                    <Typography variant="h6">Monthly Average</Typography>
                    <Typography variant="h4" color="primary">
                      {monthlyAverage.toFixed(2)} L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Total Consumption</Typography>
                    <Typography variant="h4" color="primary">
                      {totalConsumption.toFixed(2)} L
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid item xs={12} container spacing={3}>
              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Today’s Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      ${todaySpending.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Weekly Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      ${weeklySpending.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Monthly Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      ${monthlySpending.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={3}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Total Spending</Typography>
                    <Typography variant="h4" color="secondary">
                      ${totalSpending.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid item xs={12} container spacing={3}>
              <Grid item xs={6}>
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

              <Grid item xs={6}>
                <Card elevation={4}>
                  <CardContent>
                    <Typography variant="h6">Highest Spending</Typography>
                    <Typography variant="body1">
                      {highestSpending.amount
                        ? `$${highestSpending.amount.toFixed(2)} on ${highestSpending.date}`
                        : "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

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
                        <YAxis yAxisId="left" label={{ value: "Liters", angle: -90, position: "insideLeft" }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: "$ Spent", angle: -90, position: "insideRight" }} />
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

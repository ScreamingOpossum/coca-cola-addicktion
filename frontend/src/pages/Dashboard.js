import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Toolbar,
  useTheme,
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

// Mock data for the chart
const data = [
  { name: "Mon", liters: 2 },
  { name: "Tue", liters: 3 },
  { name: "Wed", liters: 1.5 },
  { name: "Thu", liters: 4 },
  { name: "Fri", liters: 3.2 },
  { name: "Sat", liters: 2.5 },
  { name: "Sun", liters: 3.5 },
];

// Dashboard Component
export default function Dashboard() {
  const theme = useTheme(); // Material-UI Theme for dynamic styling

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3, // Padding for consistent spacing
        marginLeft: "250px", // Push content right to avoid overlap
        minHeight: "100vh", // Full height
        overflowY: "auto", // Scroll content if too long
        backgroundColor: theme.palette.background.default, // Dynamic background
      }}
    >
      {/* Toolbar Spacer for Sidebar */}
      <Toolbar />

      {/* Dashboard Title */}
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Dashboard Metrics */}
      <Grid container spacing={3}>
        {/* Today’s Consumption */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Today’s Consumption</Typography>
              <Typography variant="h4" color="primary">
                2.5 L
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
                20 L
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
                3.0 L
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
                $45
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
                  height: 350, // Fixed height for consistent scaling
                  padding: 2, // Adds spacing inside chart
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Line
                      type="monotone"
                      dataKey="liters"
                      stroke={theme.palette.primary.main} // Dynamic primary color
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

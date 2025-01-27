// Analytics.js

import React from "react";
import {
  Box,
  Typography,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

// Register all chart elements for lines & bars
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const {
    loading,
    dailyTrends,
    weeklyOverview,
    monthlyTrends,
    monthlyComparison,
    annualOverview,
    spendingPercentage,
    milestones,
    topDays,
    averageDailyConsumption,
    selectedPreset,
    setSelectedPreset,
    customRange,
    setCustomRange,
    fetchAnalyticsData,
  } = useAnalyticsData();

  // 1) DAILY TRENDS
  const dailyTrendsData = {
    labels: dailyTrends.map((item) => item.date),
    datasets: [
      {
        label: "Daily Consumption (L)",
        data: dailyTrends.map((item) => item.liters),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.3)",
      },
    ],
  };

  // 3) WEEKLY OVERVIEW
  const weeklyOverviewData = {
    labels: weeklyOverview.map((d) => d.date),
    datasets: [
      {
        label: "Liters Consumed",
        data: weeklyOverview.map((d) => d.liters),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Spending (Br)",
        data: weeklyOverview.map((d) => d.spending),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  // 4) MONTHLY TRENDS
  const monthlyTrendsData = {
    labels: monthlyTrends.map((d) => d.date),
    datasets: [
      {
        label: "Liters (This Month)",
        data: monthlyTrends.map((d) => d.liters),
        borderColor: "rgba(255,99,132,1)",
        backgroundColor: "rgba(255,99,132,0.3)",
      },
    ],
  };

  // 6) ANNUAL OVERVIEW
  const annualOverviewData = {
    labels: annualOverview.map((m) => m.month),
    datasets: [
      {
        label: "Liters Consumed",
        data: annualOverview.map((m) => m.liters),
        backgroundColor: "rgba(255,159,64,0.6)",
      },
      {
        label: "Spending (Br)",
        data: annualOverview.map((m) => m.spending),
        backgroundColor: "rgba(75,192,192,0.6)",
      },
    ],
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: "250px",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <Toolbar />
        <Typography variant="h4" gutterBottom>
          Analytics
        </Typography>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="50vh"
          >
            <CircularProgress />
          </Box>
        ) : (
          // Each <Grid item> uses xs={12} to stack vertically
          <Grid container spacing={3} sx={{ mt: 3 }}>
            {/* 1) DAILY TRENDS */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    1) Daily Trends
                  </Typography>
                  <Line
                    data={dailyTrendsData}
                    redraw
                    options={{
                      responsive: true,
                      plugins: {
                        title: { display: true, text: "Daily Consumption by Date" },
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* 2) Compare Selected Months */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    2) Compare Selected Months
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <TextField
                        select
                        label="Preset"
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        size="small"
                      >
                        {["1 Week", "1 Month", "1 Quarter", "1 Half-Year", "1 Year"].map(
                          (option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          )
                        )}
                        <MenuItem value="Custom">Custom Range</MenuItem>
                      </TextField>
                    </Grid>

                    {selectedPreset === "Custom" && (
                      <>
                        <Grid item>
                          <DatePicker
                            label="Start Date"
                            value={customRange.start}
                            onChange={(newVal) =>
                              setCustomRange((prev) => ({ ...prev, start: newVal }))
                            }
                          />
                        </Grid>
                        <Grid item>
                          <DatePicker
                            label="End Date"
                            value={customRange.end}
                            onChange={(newVal) =>
                              setCustomRange((prev) => ({ ...prev, end: newVal }))
                            }
                          />
                        </Grid>
                      </>
                    )}

                    <Grid item>
                      <Button variant="contained" onClick={fetchAnalyticsData}>
                        Apply
                      </Button>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Bar
                      data={{
                        labels: monthlyComparison.map((m) => m.month),
                        datasets: [
                          {
                            label: "Consumption (L)",
                            data: monthlyComparison.map((m) => m.consumption),
                            backgroundColor: "rgba(54,162,235,0.6)",
                          },
                          {
                            label: "Spending (Br)",
                            data: monthlyComparison.map((m) => m.spending),
                            backgroundColor: "rgba(153,102,255,0.6)",
                          },
                        ],
                      }}
                      redraw
                      options={{ responsive: true }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 3) Weekly Overview */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    3) Weekly Overview
                  </Typography>
                  <Bar
                    data={weeklyOverviewData}
                    redraw
                    options={{
                      responsive: true,
                      plugins: {
                        title: { display: true, text: "This Week's Consumption & Spending" },
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* 4) Monthly Trends */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    4) Monthly Trends
                  </Typography>
                  <Line
                    data={monthlyTrendsData}
                    redraw
                    options={{
                      responsive: true,
                      plugins: {
                        title: { display: true, text: "Daily Trends in Specified Month" },
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* 5) Spending Percentage */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    5) Spending Percentage
                  </Typography>
                  {spendingPercentage && (
                    <Typography>
                      <strong>Income:</strong> {spendingPercentage.income} <br />
                      <strong>Total Spent:</strong> {spendingPercentage.total_spent} <br />
                      <strong>Spending %:</strong>{" "}
                      {spendingPercentage.spending_percentage}%
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 6) Annual Overview */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    6) Annual Overview
                  </Typography>
                  <Bar
                    data={annualOverviewData}
                    redraw
                    options={{
                      responsive: true,
                      plugins: {
                        title: {
                          display: true,
                          text: "Current Year's Monthly Consumption & Spending",
                        },
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* 7) Milestones */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    7) Milestones
                  </Typography>
                  <Typography>
                    <strong>Total Consumption:</strong>{" "}
                    {milestones?.total_consumption ?? 0} L
                  </Typography>
                  <Typography sx={{ mt: 1 }}>
                    <strong>Milestones Reached:</strong>
                  </Typography>
                  {Object.entries(milestones || {})
                    .filter(([k]) => k !== "total_consumption")
                    .map(([label, reached]) => (
                      <Typography key={label}>
                        {label}: {reached ? "Reached" : "Not yet"}
                      </Typography>
                    ))}
                </CardContent>
              </Card>
            </Grid>

            {/* 8) Top Spending Days */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    8) Top Spending Days
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell align="right"><strong>Amount (Br)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topDays.map((d) => (
                          <TableRow key={d.date}>
                            <TableCell>{d.date}</TableCell>
                            <TableCell align="right">{d.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* 9) Average Daily Consumption */}
            <Grid item xs={12}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    9) Average Daily Consumption
                  </Typography>
                  {averageDailyConsumption !== null && (
                    <Typography>
                      {averageDailyConsumption} L / day
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Analytics;

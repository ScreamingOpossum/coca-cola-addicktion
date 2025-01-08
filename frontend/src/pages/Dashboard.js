import React from "react";
import { Grid, Card, CardContent, Typography, Box, Toolbar } from "@mui/material";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

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
  return (
    // Ensures the content is pushed to the right of the sidebar
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3, // Padding
        marginLeft: '250px', // Matches sidebar width
        width: 'calc(100% - 250px)', // Adjust width dynamically
      }}
    >
      {/* Toolbar Spacer */}
      <Toolbar />

      {/* Title */}
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Dashboard Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Today’s Consumption</Typography>
              <Typography variant="h4">2.5 L</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Weekly Consumption</Typography>
              <Typography variant="h4">20 L</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6">Weekly Trends</Typography>
              <LineChart width={800} height={300} data={data}>
                <Line type="monotone" dataKey="liters" stroke="#e63946" /> {/* Updated to Coca-Cola red */}
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

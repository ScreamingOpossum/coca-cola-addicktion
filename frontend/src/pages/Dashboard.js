import React from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { name: "Mon", liters: 2 },
  { name: "Tue", liters: 3 },
  { name: "Wed", liters: 1.5 },
  { name: "Thu", liters: 4 },
  { name: "Fri", liters: 3.2 },
  { name: "Sat", liters: 2.5 },
  { name: "Sun", liters: 3.5 },
];

export default function Dashboard() {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
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
              <LineChart width={600} height={300} data={data}>
                <Line type="monotone" dataKey="liters" stroke="#1976d2" />
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

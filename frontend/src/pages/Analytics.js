import React from "react";
import { Box, Typography, Toolbar } from "@mui/material";

const Analytics = () => {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 3,
        marginLeft: '250px',
        width: 'calc(100% - 250px)',
      }}
    >
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Typography>Detailed visualizations and reports.</Typography>
    </Box>
  );
};

export default Analytics;

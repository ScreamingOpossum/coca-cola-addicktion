import React from "react";
import { Box, Typography, Toolbar } from "@mui/material";

const Consumption = () => {
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
        Consumption
      </Typography>
      <Typography>Track and manage Coca-Cola consumption data.</Typography>
    </Box>
  );
};

export default Consumption;

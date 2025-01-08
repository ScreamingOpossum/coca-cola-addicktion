import React from "react";
import { Box, Typography, Toolbar } from "@mui/material";

const Spending = () => {
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
        Spending
      </Typography>
      <Typography>Analyze spending habits related to Coca-Cola purchases.</Typography>
    </Box>
  );
};

export default Spending;

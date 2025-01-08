import React from "react";
import { Box, Typography, Toolbar } from "@mui/material";

const Help = () => {
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
        Help & FAQ
      </Typography>
      <Typography>Find answers to common questions and get support.</Typography>
    </Box>
  );
};

export default Help;

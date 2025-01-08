import React from "react";
import { Box, Typography, Toolbar } from "@mui/material";

const Feedback = () => {
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
        Feedback
      </Typography>
      <Typography>Submit feedback and suggestions.</Typography>
    </Box>
  );
};

export default Feedback;

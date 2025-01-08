import React from "react";
import { Box, Typography, Toolbar } from "@mui/material";

const Profile = () => {
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
        Profile
      </Typography>
      <Typography>Manage personal details, goals, and preferences.</Typography>
    </Box>
  );
};

export default Profile;

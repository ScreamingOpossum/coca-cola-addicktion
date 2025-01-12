import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Toolbar,
  TextField,
  Button,
  Grid,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";

const Profile = () => {
  const { user, updateUserProfile, fetchUserProfile } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    monthlyGoal: 0,
  });

  const [consumptionProgress, setConsumptionProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Load user data into the form and calculate progress bar
  useEffect(() => {
    if (user) {
      const {
        first_name = "",
        last_name = "",
        email = "",
        date_of_birth = "",
        monthly_goal = 0,
        current_month_consumption = 0,
      } = user;

      setFormData({
        firstName: first_name,
        lastName: last_name,
        email,
        dateOfBirth: date_of_birth,
        monthlyGoal: monthly_goal,
      });

      calculateProgressBar(monthly_goal, current_month_consumption);
    }
  }, [user]);

  const calculateProgressBar = (goal, currentConsumption) => {
    const progress = goal > 0 ? (currentConsumption / goal) * 100 : 0;
    setConsumptionProgress(progress > 100 ? 100 : progress);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "monthlyGoal" ? parseFloat(value) : value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await api.put("/user/profile", {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        monthly_goal: formData.monthlyGoal,
      });

      updateUserProfile(response.data);

      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });

      // Fetch the latest user profile to ensure data consistency
      await fetchUserProfile();
    } catch (error) {
      console.error("Profile Update Error:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile. Please try again.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
  };

  return (
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
        Profile
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Manage personal details, goals, and preferences.
      </Typography>

      {/* Progress Bar Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Box sx={{ position: "relative" }}>
            <Tooltip title={`${(user?.current_month_consumption || 0).toFixed(2)} L`} arrow>
              <LinearProgress
                variant="determinate"
                value={consumptionProgress}
                sx={{
                  height: 25,
                  borderRadius: 5,
                  backgroundColor: "#e0e0e0",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: consumptionProgress >= 100 ? "darkred" : "lightgreen",
                  },
                }}
              />
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontWeight: "bold",
                color: consumptionProgress >= 100 ? "white" : "black",
              }}
            >
              {`${consumptionProgress.toFixed(2)}%`}
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ mt: 1, textAlign: "center" }}>
            {`Current Consumption: ${(user?.current_month_consumption || 0).toFixed(2)} L / ${
              formData.monthlyGoal || 0
            } L`}
          </Typography>
        </Grid>
      </Grid>

      {/* User Information Section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            disabled
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Monthly Consumption Goal (Liters)"
            name="monthlyGoal"
            type="number"
            value={formData.monthlyGoal}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }}>
            Save Changes
          </Button>
        </Grid>
      </Grid>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;

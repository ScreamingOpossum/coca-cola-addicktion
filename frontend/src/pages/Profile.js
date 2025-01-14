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
    income: 0, // Default value for income
  });

  const [consumptionProgress, setConsumptionProgress] = useState(0);
  const [progressColor, setProgressColor] = useState("lightgreen");
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
        income = 0, // Ensure default value
        current_month_consumption = 0,
      } = user;

      setFormData({
        firstName: first_name,
        lastName: last_name,
        email,
        dateOfBirth: date_of_birth,
        monthlyGoal: monthly_goal,
        income, // Ensure default value
      });

      calculateProgressBar(monthly_goal, current_month_consumption);
    }
  }, [user]);

  const calculateProgressBar = (goal, currentConsumption) => {
    const progress = goal > 0 ? (currentConsumption / goal) * 100 : 0;
    setConsumptionProgress(progress);

    // Update color based on thresholds
    let color = "#66BB6A";
    if (progress > 100) color = "darkred";
    else if (progress >= 90) color = "red";
    else if (progress >= 75) color = "orange";
    else if (progress >= 50) color = "#ffc800";
    else if (progress >= 25) color = "green";

    setProgressColor(color);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "income"
        ? value.replace(/[^0-9.]/g, "") // Strip non-numeric characters
        : value,
    }));
  };

  const formatCurrency = (value) => {
    return value ? `${parseFloat(value).toFixed(2)} Br` : "";
  };

  const handleSave = async () => {
    try {
      const response = await api.put("/user/profile", {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        monthly_goal: formData.monthlyGoal,
        income: parseFloat(formData.income) || 0, // Parse income back to number
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
                value={Math.min(consumptionProgress, 100)} // Cap progress visually at 100%
                sx={{
                  height: 25,
                  borderRadius: 5,
                  backgroundColor: "#e0e0e0",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: progressColor,
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
                color: progressColor === "darkred" ? "white" : "black",
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
            value={formData.monthlyGoal || ""}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Monthly Income (Optional)"
            name="income"
            value={formatCurrency(formData.income)}
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

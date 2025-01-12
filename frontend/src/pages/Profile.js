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
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";

const Profile = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    monthlyGoal: 0,
  });
  const [consumptionProgress, setConsumptionProgress] = useState(0);
  const [consumptionBarColor, setConsumptionBarColor] = useState("lightgreen");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
  console.log("Profile.js - User from context:", user);
  if (user) {
    setFormData({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      dateOfBirth: user.date_of_birth || "",
      monthlyGoal: user.monthly_goal || 0,
    });
    calculateProgressBar(user.monthly_goal, user.current_month_consumption || 0);
  }
}, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/user/profile");
        const userData = response.data;
        console.log("Fetched user data:", userData);
        setFormData({
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.email || "",
          dateOfBirth: userData.date_of_birth || "",
          monthlyGoal: userData.monthly_goal || 0,
        });
        calculateProgressBar(userData.monthly_goal, userData.current_month_consumption || 0);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (!user) {
      fetchUserData();
    } else {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        dateOfBirth: user.date_of_birth || "",
        monthlyGoal: user.monthly_goal || 0,
      });
      calculateProgressBar(user.monthly_goal, user.current_month_consumption || 0);
    }
  }, [user]);

  const calculateProgressBar = (goal, currentConsumption) => {
    const progress = goal > 0 ? (currentConsumption / goal) * 100 : 0;
    setConsumptionProgress(progress > 100 ? 100 : progress);

    let color = "lightgreen";
    if (progress <= 25) color = "lightgreen";
    else if (progress <= 50) color = "green";
    else if (progress <= 75) color = "yellow";
    else if (progress <= 90) color = "orange";
    else if (progress <= 100) color = "red";
    else color = "darkred";

    setConsumptionBarColor(color);
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
        monthly_goal: formData.monthlyGoal,
      });
      updateUserProfile(response.data);
      setSnackbar({ open: true, message: "Profile updated successfully!", severity: "success" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({ open: true, message: "Failed to update profile. Please try again.", severity: "error" });
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
        width: "calc(100% - 250px)",
      }}
    >
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Manage personal details, goals, and preferences.
      </Typography>

      {!formData.firstName ? (
        <Typography variant="h6">Loading profile data...</Typography>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mt: 2 }}>
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
                InputLabelProps={{
                  shrink: true,
                }}
                disabled
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
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{ mt: 2 }}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Consumption Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={consumptionProgress}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: "#e0e0e0",
                "& .MuiLinearProgress-bar": {
                  backgroundColor: consumptionBarColor,
                },
              }}
            />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              {`Current Consumption: ${(user?.current_month_consumption || 0).toFixed(2)} L / ${
                formData.monthlyGoal
              } L`}
            </Typography>
          </Box>
        </>
      )}

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

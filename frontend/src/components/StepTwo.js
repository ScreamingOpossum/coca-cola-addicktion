import React, { useState } from "react";
import {
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Box,
    Snackbar,
    Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const StepTwo = ({ formData, handleChange, handleSubmit, handleBack }) => {
    // States for Password Visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Error State for Validations
    const [error, setError] = useState({});

    // Snackbar State
    const [snackbarOpen, setSnackbarOpen] = useState(false); // Controls Snackbar visibility
    const [snackbarMessage, setSnackbarMessage] = useState(""); // Snackbar text
    const [snackbarSeverity, setSnackbarSeverity] = useState("error"); // Error or success

    // Toggle Visibility for Password Fields
    const handleTogglePassword = () => setShowPassword(!showPassword);
    const handleToggleConfirmPassword = () =>
        setShowConfirmPassword(!showConfirmPassword);

    // Close Snackbar
    const handleCloseSnackbar = () => setSnackbarOpen(false);

    // Final Submit Validation
    const handleFinalSubmit = () => {
        const newErrors = {};

        // Field Validations
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First Name is required.";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last Name is required.";
        }
        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = "Date of Birth is required.";
        }
        if (!formData.monthlyGoal || parseFloat(formData.monthlyGoal) <= 0) {
            newErrors.monthlyGoal = "Monthly Goal should be greater than 0.";
        }
        if (!formData.password || formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters.";
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        // Set Errors
        setError(newErrors);

        // Show Error Message if Validation Fails
        if (Object.keys(newErrors).length > 0) {
            setSnackbarMessage("Please fix errors before proceeding.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true); // Show pop-up
            return; // Stop submission
        }

        // Success Snackbar and Submit
        setSnackbarMessage("Registration successful!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        // Proceed with Submission if Valid
        handleSubmit();
    };

    return (
        <Box>
            {/* First Name */}
            <TextField
                fullWidth
                margin="normal"
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                variant="outlined"
                error={!!error.firstName}
                helperText={error.firstName}
            />

            {/* Last Name */}
            <TextField
                fullWidth
                margin="normal"
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                variant="outlined"
                error={!!error.lastName}
                helperText={error.lastName}
            />

            {/* Date of Birth */}
            <TextField
                fullWidth
                margin="normal"
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.dateOfBirth}
                onChange={handleChange}
                variant="outlined"
                error={!!error.dateOfBirth}
                helperText={error.dateOfBirth}
            />

            {/* Monthly Goal */}
            <TextField
                fullWidth
                margin="normal"
                label="Monthly Goal (liters)"
                name="monthlyGoal"
                type="number"
                value={formData.monthlyGoal}
                onChange={handleChange}
                variant="outlined"
                error={!!error.monthlyGoal}
                helperText={error.monthlyGoal}
            />

            {/* Password */}
            <TextField
                fullWidth
                margin="normal"
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
                error={!!error.password}
                helperText={error.password}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleTogglePassword} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            {/* Confirm Password */}
            <TextField
                fullWidth
                margin="normal"
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                variant="outlined"
                error={!!error.confirmPassword}
                helperText={error.confirmPassword}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleToggleConfirmPassword} edge="end">
                                {showConfirmPassword ? (
                                    <VisibilityOff />
                                ) : (
                                    <Visibility />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            {/* Buttons */}
            <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                <Button variant="contained" onClick={handleBack}>
                    Back
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFinalSubmit} // Trigger validation on click
                >
                    Finish
                </Button>
            </Box>

            {/* Snackbar Notification */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000} // Close after 3 seconds
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity} // Error or success style
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StepTwo;
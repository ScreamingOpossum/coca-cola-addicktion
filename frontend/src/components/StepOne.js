import React, { useState } from "react";
import {
    TextField,
    Button,
    Box,
    Typography,
    Snackbar,
    Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const StepOne = ({ formData, handleChange, handleNext }) => {
    const navigate = useNavigate(); // React Router hook for navigation

    // Snackbar States
    const [openSnackbar, setOpenSnackbar] = useState(false); // Controls visibility
    const [snackbarMessage, setSnackbarMessage] = useState(""); // Snackbar text
    const [snackbarSeverity, setSnackbarSeverity] = useState("error"); // Severity: error/success

    // Close Snackbar Handler
    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    // Validate and Proceed to Next Step
    const handleProceed = () => {
        // Validation
        if (!formData.email.trim()) {
            setSnackbarMessage("Email address is required.");
            setSnackbarSeverity("error");
            setOpenSnackbar(true); // Show pop-up
            return; // Stop submission
        }

        // Proceed if no validation errors
        handleNext();
    };

    return (
        <Box>
            {/* Title */}
            <Typography variant="h5" gutterBottom>
                Register - Step 1
            </Typography>

            {/* Email Input */}
            <TextField
                fullWidth
                margin="normal"
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
            />

            {/* Navigation Buttons */}
            <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                {/* Back to Login Button */}
                <Button
                    variant="contained" // Same as Next button
                    color="primary"    // Same color as Next button
                    onClick={() => navigate("/login")} // Navigate back to login
                >
                    Back to Login
                </Button>

                {/* Next Button */}
                <Button variant="contained" color="primary" onClick={handleProceed}>
                    Next
                </Button>
            </Box>

            {/* Snackbar Notification */}
            <Snackbar
                open={openSnackbar}
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

export default StepOne;

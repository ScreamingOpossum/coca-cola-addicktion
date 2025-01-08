import React, { useState } from "react";
import {
    TextField,
    Button,
    Box,
    Snackbar,
    Alert,
} from "@mui/material";

const StepOne = ({ formData, handleChange, handleNext }) => {
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

            {/* Next Button Centered */}
            <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
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

import React from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const StepOne = ({ formData, handleChange, handleNext }) => {
    const navigate = useNavigate(); // React Router hook for navigation

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
                <Button variant="contained" color="primary" onClick={handleNext}>
                    Next
                </Button>
            </Box>
        </Box>
    );
};

export default StepOne;
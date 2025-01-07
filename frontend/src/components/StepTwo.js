import React, { useState } from "react";
import {
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Box,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const StepTwo = ({ formData, handleChange, handleSubmit, handleBack }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    // Toggle Password Visibility
    const handleTogglePassword = () => setShowPassword(!showPassword);
    const handleToggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    // Validate Password Match
    const validatePasswords = () => {
        if (formData.password !== confirmPassword) {
            setError("Passwords do not match!");
            return false;
        }
        setError("");
        return true;
    };

    // Handle Submit with Validation
    const handleFinalSubmit = () => {
        if (validatePasswords()) {
            handleSubmit(); // Proceed with form submission
        }
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
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                error={!!error} // Show error state
                helperText={error} // Show error message
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={handleToggleConfirmPassword} edge="end">
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                <Button variant="contained" color="primary" onClick={handleFinalSubmit}>
                    Finish
                </Button>
            </Box>
        </Box>
    );
};

export default StepTwo;

import React, { useState } from "react";
import {
    Container,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Button,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import StepOne from "../components/StepOne";
import StepTwo from "../components/StepTwo";

// Steps for the stepper
const steps = ["Email Address", "Personal Information"];

const Register = () => {
    // State for stepper navigation
    const [activeStep, setActiveStep] = useState(0);

    // State for form data
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        monthlyGoal: "",
        password: "",
        confirmPassword: "",
    });

    // Loading State
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Go to Next Step
    const handleNext = () => {
        if (activeStep === 0) {
            // Validate email before moving forward
            if (!formData.email.trim()) {
                alert("Email is required!");
                return;
            }

            // Email regex validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                alert("Invalid email address!");
                return;
            }
        }
        setActiveStep(activeStep + 1);
    };

    // Go to Previous Step
    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    // Submit Form
    const handleSubmit = async () => {
        // Input validation
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            alert("First name and last name are required!");
            return;
        }
        if (!formData.dateOfBirth) {
            alert("Date of birth is required!");
            return;
        }
        if (!formData.monthlyGoal || formData.monthlyGoal <= 0) {
            alert("Monthly goal should be greater than 0!");
            return;
        }
        if (formData.password.length < 8) {
            alert("Password must be at least 8 characters long!");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            setLoading(true); // Enable loading state
            const response = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dateOfBirth: formData.dateOfBirth,
                    monthlyGoal: parseFloat(formData.monthlyGoal),
                    password: formData.password,
                }),
            });

            if (response.ok) {
                alert("Registration successful!");
                navigate("/login");
            } else {
                const data = await response.json();
                alert(data.detail || "Registration failed!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Try again!");
        } finally {
            setLoading(false); // Disable loading state
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 4,
                    padding: 4,
                    boxShadow: 3,
                    borderRadius: 2,
                }}
            >
                <Typography variant="h4" align="center" gutterBottom>
                    Register
                </Typography>

                {/* Stepper */}
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Step Content */}
                <Box sx={{ marginTop: 4 }}>
                    {activeStep === 0 && (
                        <StepOne
                            formData={formData}
                            handleChange={handleChange}
                            handleNext={handleNext}
                        />
                    )}
                    {activeStep === 1 && (
                        <StepTwo
                            formData={formData}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                            handleBack={handleBack}
                        />
                    )}
                </Box>

                {/* Back to Login */}
                {activeStep === 0 && (
                    <Box sx={{ textAlign: "center", marginTop: 2 }}>
                        <Button
                            variant="text"
                            onClick={() => navigate("/login")}
                            sx={{ textTransform: "none" }}
                        >
                            Already have an account? Login
                        </Button>
                    </Box>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <Box sx={{ textAlign: "center", marginTop: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
            </Box>
        </Container>
    );
};

export default Register;

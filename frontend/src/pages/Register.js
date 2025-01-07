import React, { useState } from "react";
import { Container, Box, Typography, Stepper, Step, StepLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import StepOne from "../components/StepOne";
import StepTwo from "../components/StepTwo";

// Steps
const steps = ["Email Address", "Personal Information"];

const Register = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        monthlyGoal: "",
        password: "",
    });

    const navigate = useNavigate();

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Go to Next Step
    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };

    // Go to Previous Step
    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    // Submit Form
    const handleSubmit = async () => {
        try {
            const response = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                alert("Registration successful!");
                navigate("/login");
            } else {
                alert("Registration failed!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Try again!");
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ marginTop: 4, padding: 4, boxShadow: 3, borderRadius: 2 }}>
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
                        <StepOne formData={formData} handleChange={handleChange} handleNext={handleNext} />
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
            </Box>
        </Container>
    );
};

export default Register;

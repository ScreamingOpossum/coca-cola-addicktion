import React, { useState } from "react";
import {
  Box,
  Typography,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
} from "@mui/material";
import axios from "axios";

const Consumption = () => {
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null); // State for error handling
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    litersConsumed: "",
    notes: "",
  });

  const handleOpenForm = () => setOpenForm(true);
  const handleCloseForm = () => {
    setOpenForm(false);
    setError(null); // Clear error on form close
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate litersConsumed is a positive number
    if (parseFloat(formData.litersConsumed) <= 0) {
      setError("Liters consumed must be a positive number.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token is missing. Please log in.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/consumption", // Ensure this matches your backend API
        {
          date: formData.date,
          litersConsumed: parseFloat(formData.litersConsumed),
          notes: formData.notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Consumption entry added:", response.data);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        litersConsumed: "",
        notes: "",
      }); // Reset form
      setOpenForm(false); // Close form
      setError(null); // Clear errors
      // Optionally refresh data or show a success notification
    } catch (error) {
      console.error("Failed to add consumption entry:", error);
      setError(
        error.response?.data?.detail || "Failed to add consumption entry. Please try again."
      );
    }
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
        Consumption
      </Typography>
      <Typography>Track and manage Coca-Cola consumption data.</Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={handleOpenForm}
      >
        Add Consumption
      </Button>

      {/* Pop-up Form */}
      <Dialog open={openForm} onClose={handleCloseForm}>
        <DialogTitle>Add Consumption</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Liters Consumed"
            type="number"
            name="litersConsumed"
            value={formData.litersConsumed}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Consumption;

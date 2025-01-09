import React, { useState } from "react";
import { Box, Typography, Toolbar, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import axios from "axios";

const Consumption = () => {
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    litersConsumed: "",
    location: "",
    notes: "",
  });

  const handleOpenForm = () => setOpenForm(true);
  const handleCloseForm = () => setOpenForm(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post("/consumption", {
        date: formData.date,
        litersConsumed: parseFloat(formData.litersConsumed),
        location: formData.location,
        notes: formData.notes,
      });
      console.log("Consumption entry added:", response.data);
      setOpenForm(false);
      // Optionally refresh data or show a success notification
    } catch (error) {
      console.error("Failed to add consumption entry:", error);
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
            label="Location"
            name="location"
            value={formData.location}
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

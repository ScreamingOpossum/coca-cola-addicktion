import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";

const ConsumptionForm = ({ open, onClose, onAdd }) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await axios.post("/consumption", {
        date,
        quantity: parseFloat(quantity),
        location,
        notes,
      });
      onAdd(response.data);
      onClose();
    } catch (error) {
      console.error("Failed to add consumption entry", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Consumption</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
          />
          <TextField
            label="Quantity (Liters)"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
          />
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsumptionForm;

import React, { useState, useEffect, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
} from "@mui/material";
import axios from "axios";

const Consumption = () => {
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    litersConsumed: "",
    notes: "",
  });
  const [monthlyData, setMonthlyData] = useState([]);

  // Open and close the add consumption dialog
  const handleOpenForm = () => setOpenForm(true);
  const handleCloseForm = () => {
    setOpenForm(false);
    setError(null);
  };

  // Handle form data change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch monthly consumption data
  const fetchMonthlyData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/consumption/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Fetched monthly data:", response.data.data);

      setMonthlyData(
        response.data.data.map((month) => ({
          ...month,
          highest_consumption:
            month.highest_consumption?.liters && month.highest_consumption?.date
              ? `${month.highest_consumption.liters} L on ${month.highest_consumption.date}`
              : "N/A",
        }))
      );
      setError(null);
    } catch (err) {
      console.error("Failed to fetch monthly history:", err);

      setError(
        err.response?.data?.detail || "Failed to fetch monthly history. Please try again."
      );
    }
  }, []);

  // Handle form submission to add consumption
  const handleSubmit = async () => {
    if (!formData.date || !formData.litersConsumed) {
      setError("All fields are required.");
      return;
    }

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
        "http://127.0.0.1:8000/consumption",
        {
          date: formData.date,
          liters_consumed: parseFloat(formData.litersConsumed),
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
      });
      setOpenForm(false);
      setError(null);
      setSuccess(true);
      fetchMonthlyData();
    } catch (err) {
      console.error("Failed to add consumption entry:", err);

      setError(
        err.response?.data?.detail || "Failed to add consumption entry. Please try again."
      );
    }
  };

  // Handle success notification close
  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

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

      {/* Monthly History */}
      {monthlyData.map((month, index) => (
        <Box key={index} sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {month.month}
          </Typography>
          <Typography variant="subtitle1">
            Total Consumption: {month.total_consumption} L
          </Typography>
          <Typography variant="subtitle1">
            Average Daily Consumption: {month.average_daily_consumption.toFixed(2)} L
          </Typography>
          <Typography variant="subtitle1">
            Highest Consumption: {month.highest_consumption}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Liters Consumed</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(month.entries || []).map((entry, entryIndex) => (
                  <TableRow key={entryIndex}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.liters_consumed}</TableCell>
                    <TableCell>{entry.notes || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

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

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: "100%" }}>
          New consumption record added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consumption;

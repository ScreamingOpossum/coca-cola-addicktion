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

const Spending = () => {
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    liters: "",
    amountSpent: "",
    store: "",
    city: "",
    notes: "",
  });
  const [monthlyData, setMonthlyData] = useState([]);

  const handleOpenForm = () => setOpenForm(true);
  const handleCloseForm = () => {
    setOpenForm(false);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchMonthlyData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/spending/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response Data:", response.data);

      setMonthlyData(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch monthly spending history:", err);
      setError(
        err.response?.data?.detail || "Failed to fetch monthly spending history. Please try again."
      );
    }
  }, []);

  const handleSubmit = async () => {
    if (!formData.date || !formData.amountSpent || !formData.liters) {
      setError("Date, Liters, and Amount Spent are required fields.");
      return;
    }

    if (parseFloat(formData.amountSpent) <= 0 || parseFloat(formData.liters) <= 0) {
      setError("Liters and Amount Spent must be positive numbers.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token is missing. Please log in.");
        return;
      }

      await axios.post(
        "http://127.0.0.1:8000/spending",
        {
          date: formData.date,
          liters: parseFloat(formData.liters),
          amount_spent: parseFloat(formData.amountSpent),
          store: formData.store,
          city: formData.city,
          notes: formData.notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFormData({
        date: new Date().toISOString().split("T")[0],
        liters: "",
        amountSpent: "",
        store: "",
        city: "",
        notes: "",
      });
      setOpenForm(false);
      setError(null);
      setSuccess(true);
      fetchMonthlyData();
    } catch (err) {
      console.error("Failed to add spending entry:", err);
      setError(
        err.response?.data?.detail || "Failed to add spending entry. Please try again."
      );
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

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
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Spending
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Track and manage Coca-Cola spending data.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={handleOpenForm}
      >
        Add Spending
      </Button>

      {monthlyData.map((month, index) => (
        <Box key={index} sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {month.month}
          </Typography>
          <Typography variant="subtitle1">
            Total Spending: {month.total_spending || "N/A"} Br
          </Typography>
          <Typography variant="subtitle1">
            Average Daily Spending: {month.average_daily_spending?.toFixed(2) || "N/A"} Br
          </Typography>
          <Typography variant="subtitle1">
            Highest Spending: {month.highest_spending.amount || "N/A"} Br on{" "}
            {month.highest_spending.date || "N/A"}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Liters</TableCell>
                  <TableCell>Amount Spent</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(month.entries || []).map((entry, entryIndex) => (
                  <TableRow key={entryIndex}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.liters || "N/A"}</TableCell>
                    <TableCell>{entry.amount_spent || "N/A"} Br</TableCell>
                    <TableCell>{entry.store || "N/A"}</TableCell>
                    <TableCell>{entry.city || "N/A"}</TableCell>
                    <TableCell>{entry.notes || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Dialog open={openForm} onClose={handleCloseForm}>
        <DialogTitle>Add Spending</DialogTitle>
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
            label="Liters"
            type="number"
            name="liters"
            value={formData.liters}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Amount Spent"
            type="number"
            name="amountSpent"
            value={formData.amountSpent}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Store"
            name="store"
            value={formData.store}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="City"
            name="city"
            value={formData.city}
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

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: "100%" }}>
          New spending record added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Spending;

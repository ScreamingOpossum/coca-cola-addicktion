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
  Pagination,
} from "@mui/material";
import axios from "axios";

const ITEMS_PER_PAGE = 8;

const Consumption = () => {
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    litersConsumed: "",
    notes: "",
  });
  const [monthlyData, setMonthlyData] = useState([]); // Stores monthly data
  const [paginationStates, setPaginationStates] = useState({}); // Pagination state for each month

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

      const response = await axios.get("http://127.0.0.1:8000/consumption/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.data || [];
      const initialPaginationStates = {};

      data.forEach((month, index) => {
        const totalPages = Math.ceil((month.entries || []).length / ITEMS_PER_PAGE);
        initialPaginationStates[index] = { currentPage: 1, totalPages };
      });

      setMonthlyData(data);
      setPaginationStates(initialPaginationStates);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch monthly consumption history:", err);
      setError(
        err.response?.data?.detail || "Failed to fetch monthly consumption history. Please try again."
      );
    }
  }, []);

  const handleSubmit = async () => {
    if (!formData.date || !formData.litersConsumed) {
      setError("Date and Liters Consumed are required fields.");
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

      await axios.post(
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

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  const handlePageChange = (monthIndex, event, value) => {
    setPaginationStates((prev) => ({
      ...prev,
      [monthIndex]: { ...prev[monthIndex], currentPage: value },
    }));
  };

  const getPaginatedEntries = (entries, currentPage) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
        Consumption
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Track and manage Coca-Cola consumption data.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={handleOpenForm}
      >
        Add Consumption
      </Button>

      {monthlyData.map((month, index) => {
        const currentPage = paginationStates[index]?.currentPage || 1;
        const paginatedEntries = getPaginatedEntries(month.entries || [], currentPage);

        return (
          <Box key={index} sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              {month.month}
            </Typography>
            <Typography variant="subtitle1">
              Total Consumption: {month.total_consumption || "N/A"} L
            </Typography>
            <Typography variant="subtitle1">
              Average Daily Consumption: {month.average_daily_consumption?.toFixed(2) || "N/A"} L
            </Typography>
            <Typography variant="subtitle1">
              Highest Consumption: {month.highest_consumption.liters || "N/A"} L on{" "}
              {month.highest_consumption.date || "N/A"}
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
                  {paginatedEntries.map((entry, entryIndex) => (
                    <TableRow key={entryIndex}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.liters_consumed || "N/A"}</TableCell>
                      <TableCell>{entry.notes || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={paginationStates[index]?.totalPages || 1}
                page={paginationStates[index]?.currentPage || 1}
                onChange={(event, value) => handlePageChange(index, event, value)}
                color="primary"
              />
            </Box>
          </Box>
        );
      })}

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

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: "100%" }}>
          New consumption record added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consumption;

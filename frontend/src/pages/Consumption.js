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
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import api from "../utils/api";

const ITEMS_PER_PAGE = 5;

const Consumption = () => {
  const [openForm, setOpenForm] = useState(false);
  const [formType, setFormType] = useState("add"); // 'add' or 'edit'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    litersConsumed: "",
    notes: "",
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [paginationStates, setPaginationStates] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenForm = (type = "add", entry = null) => {
    setFormType(type);
    setSelectedEntry(entry);
    if (entry) {
      setFormData({
        date: entry.date,
        litersConsumed: entry.liters_consumed,
        notes: entry.notes,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        litersConsumed: "",
        notes: "",
      });
    }
    setOpenForm(true);
  };

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
      const response = await api.get("/consumption/history");
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
      if (formType === "add") {
        await api.post("/consumption", {
          date: formData.date,
          liters_consumed: parseFloat(formData.litersConsumed),
          notes: formData.notes,
        });
      } else if (formType === "edit" && selectedEntry) {
        await api.put(`/consumption/${selectedEntry.id}`, {
          date: formData.date,
          liters_consumed: parseFloat(formData.litersConsumed),
          notes: formData.notes,
        });
      }

      setOpenForm(false);
      setSuccess(true);
      fetchMonthlyData();
    } catch (err) {
      console.error("Failed to save consumption entry:", err);
      setError(err.response?.data?.detail || "Failed to save consumption entry. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      if (entryToDelete) {
        await api.delete(`/consumption/${entryToDelete.id}`);
        setConfirmationDialog(false);
        setEntryToDelete(null);
        setSuccess(true);
        fetchMonthlyData();
      }
    } catch (err) {
      console.error("Failed to delete consumption entry:", err);
      setError(err.response?.data?.detail || "Failed to delete consumption entry. Please try again.");
    }
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

  const handleMenuClick = (event, entry) => {
    setAnchorEl(event.currentTarget);
    setSelectedEntry(entry);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={() => handleOpenForm("add")}
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
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEntries.map((entry, entryIndex) => (
                    <TableRow key={entryIndex}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.liters_consumed || "N/A"}</TableCell>
                      <TableCell>{entry.notes || "N/A"}</TableCell>
                      <TableCell>
                        <IconButton onClick={(e) => handleMenuClick(e, entry)}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && selectedEntry?.id === entry.id}
                          onClose={handleMenuClose}
                        >
                          <MenuItem onClick={() => handleOpenForm("edit", entry)}>Edit</MenuItem>
                          <MenuItem
                            onClick={() => {
                              setConfirmationDialog(true);
                              setEntryToDelete(entry);
                              handleMenuClose();
                            }}
                          >
                            Delete
                          </MenuItem>
                        </Menu>
                      </TableCell>
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
        <DialogTitle>{formType === "add" ? "Add Consumption" : "Edit Consumption"}</DialogTitle>
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

      <Dialog open={confirmationDialog} onClose={() => setConfirmationDialog(false)}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: "100%" }}>
          Operation successful!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consumption;

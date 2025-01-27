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

const Spending = () => {
  const [openForm, setOpenForm] = useState(false);
  const [formType, setFormType] = useState("add"); // 'add' or 'edit'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
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
  const [paginationStates, setPaginationStates] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenForm = (type = "add", entry = null) => {
    setFormType(type);
    setSelectedEntry(entry);
    if (entry) {
      setFormData({
        date: entry.date,
        liters: entry.liters,
        amountSpent: entry.amount_spent,
        store: entry.store,
        city: entry.city,
        notes: entry.notes,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        liters: "",
        amountSpent: "",
        store: "",
        city: "",
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
      const response = await api.get("/spending/history");
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
      if (formType === "add") {
        await api.post("/spending", {
          date: formData.date,
          liters: parseFloat(formData.liters),
          amount_spent: parseFloat(formData.amountSpent),
          store: formData.store,
          city: formData.city,
          notes: formData.notes,
        });
      } else if (formType === "edit" && selectedEntry) {
        await api.put(`/spending/${selectedEntry.id}`, {
          date: formData.date,
          liters: parseFloat(formData.liters),
          amount_spent: parseFloat(formData.amountSpent),
          store: formData.store,
          city: formData.city,
          notes: formData.notes,
        });
      }

      setOpenForm(false);
      setSuccess(true);
      fetchMonthlyData();
    } catch (err) {
      console.error("Failed to save spending entry:", err);
      setError(err.response?.data?.detail || "Failed to save spending entry. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      if (entryToDelete) {
        await api.delete(`/spending/${entryToDelete.id}`);
        setConfirmationDialog(false);
        setEntryToDelete(null);
        setSuccess(true);
        fetchMonthlyData();
      }
    } catch (err) {
      console.error("Failed to delete spending entry:", err);
      setError(err.response?.data?.detail || "Failed to delete spending entry. Please try again.");
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
        Spending
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={() => handleOpenForm("add")}
      >
        Add Spending
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
  Total Spending: {month.total_spending?.toFixed(2) || "N/A"} Br
</Typography>
<Typography variant="subtitle1">
  Average Daily Spending: {month.average_daily_spending?.toFixed(2) || "N/A"} Br
</Typography>
<Typography variant="subtitle1">
  Highest Spending: {month.highest_spending.amount?.toFixed(2) || "N/A"} Br on{" "}
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
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEntries.map((entry, entryIndex) => (
                    <TableRow key={entryIndex}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.liters || "N/A"}</TableCell>
                      <TableCell>{entry.amount_spent || "N/A"} Br</TableCell>
                      <TableCell>{entry.store || "N/A"}</TableCell>
                      <TableCell>{entry.city || "N/A"}</TableCell>
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
        <DialogTitle>{formType === "add" ? "Add Spending" : "Edit Spending"}</DialogTitle>
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

export default Spending;

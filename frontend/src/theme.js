import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Blue color
    },
    secondary: {
      main: "#f50057", // Pink color
    },
    background: {
      default: "#f4f6f8", // Light background
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: {
      fontWeight: 600,
    },
    body2: {
      fontSize: "0.9rem",
    },
  },
});

export default theme;

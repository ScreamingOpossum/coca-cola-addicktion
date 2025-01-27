import React, { useContext } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
} from "@mui/material";
import {
  FaChartBar,
  FaGlassWhiskey,
  FaMoneyBillWave,
  FaUser,
  FaSignOutAlt,
  FaChartLine,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const drawerWidth = 250;

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout(); // Call logout function from context
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1e1e2f",
          color: "#ffffff",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: "auto" }}>
        <List>
          <ListItem component={NavLink} to="/dashboard" button sx={{ color: "#ffffff" }}>
            <ListItemIcon sx={{ color: "#ffffff" }}>
              <FaChartBar />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem component={NavLink} to="/consumption" button sx={{ color: "#ffffff" }}>
            <ListItemIcon sx={{ color: "#ffffff" }}>
              <FaGlassWhiskey />
            </ListItemIcon>
            <ListItemText primary="Consumption" />
          </ListItem>
          <ListItem component={NavLink} to="/spending" button sx={{ color: "#ffffff" }}>
            <ListItemIcon sx={{ color: "#ffffff" }}>
              <FaMoneyBillWave />
            </ListItemIcon>
            <ListItemText primary="Spending" />
          </ListItem>
          <ListItem component={NavLink} to="/analytics" button sx={{ color: "#ffffff" }}>
            <ListItemIcon sx={{ color: "#ffffff" }}>
              <FaChartLine />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
          </ListItem>
          <ListItem component={NavLink} to="/profile" button sx={{ color: "#ffffff" }}>
            <ListItemIcon sx={{ color: "#ffffff" }}>
              <FaUser />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
        </List>
        <Divider />
      </Box>
      <Box sx={{ position: "absolute", bottom: 20, width: "100%", textAlign: "center" }}>
        <ListItem button onClick={handleLogout} sx={{ color: "#e63946" }}>
          <ListItemIcon sx={{ color: "#e63946" }}>
            <FaSignOutAlt />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

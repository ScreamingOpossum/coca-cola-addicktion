import React, { useContext } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    Box,
} from '@mui/material';
import {
    FaChartBar,
    FaGlassWhiskey,
    FaMoneyBillWave,
    FaUser,
    FaQuestionCircle,
    FaSignOutAlt,
    FaChartLine,
    FaCommentDots,
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext"; // Import AuthContext for logout

const drawerWidth = 250;

const Sidebar = () => {
    const { logout } = useContext(AuthContext); // Access the logout function from context

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#1e1e2f',
                    color: '#ffffff',
                },
            }}
        >
            {/* Toolbar Spacer */}
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
                <List>
                    {/* Navigation Items */}
                    <ListItem component={NavLink} to="/dashboard" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaChartBar />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItem>
                    <ListItem component={NavLink} to="/consumption" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaGlassWhiskey />
                        </ListItemIcon>
                        <ListItemText primary="Consumption" />
                    </ListItem>
                    <ListItem component={NavLink} to="/spending" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaMoneyBillWave />
                        </ListItemIcon>
                        <ListItemText primary="Spending" />
                    </ListItem>
                    <ListItem component={NavLink} to="/analytics" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaChartLine />
                        </ListItemIcon>
                        <ListItemText primary="Analytics" />
                    </ListItem>
                    <ListItem component={NavLink} to="/profile" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaUser />
                        </ListItemIcon>
                        <ListItemText primary="Profile" />
                    </ListItem>
                </List>
                <Divider />
                <List>
                    <ListItem component={NavLink} to="/help" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaQuestionCircle />
                        </ListItemIcon>
                        <ListItemText primary="Help & FAQ" />
                    </ListItem>
                    <ListItem component={NavLink} to="/feedback" sx={{ color: '#ffffff' }}>
                        <ListItemIcon sx={{ color: '#ffffff' }}>
                            <FaCommentDots />
                        </ListItemIcon>
                        <ListItemText primary="Feedback" />
                    </ListItem>
                </List>
            </Box>

            {/* Footer */}
            <Box sx={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
                <ListItem button onClick={logout} sx={{ color: '#e63946' }}> {/* Trigger logout */}
                    <ListItemIcon sx={{ color: '#e63946' }}>
                        <FaSignOutAlt />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
                <Box sx={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>v1.0.0</Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;

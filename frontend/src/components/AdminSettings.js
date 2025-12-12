import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Divider,
  Stack,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchAuditLogs,
  fetchCompanySettings,
  updateCompanySettings,
  fetchCurrentUser,
} from "../api";

// Role configuration
const ROLES = [
  { value: "admin", label: "Admin", color: "error", description: "Full access to all features" },
  { value: "manager", label: "Manager", color: "warning", description: "Can manage products and view reports" },
  { value: "sales", label: "Sales", color: "info", description: "Can view products and send emails" },
  { value: "viewer", label: "Viewer", color: "default", description: "Read-only access" },
];

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// User Form Dialog
function UserFormDialog({ open, onClose, user, onSave, isEdit }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "viewer",
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        username: user.username || "",
        password: "",
        email: user.email || "",
        role: user.role || "viewer",
        is_active: user.is_active !== false,
      });
    } else {
      setFormData({
        username: "",
        password: "",
        email: "",
        role: "viewer",
        is_active: true,
      });
    }
    setErrors({});
  }, [user, isEdit, open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!isEdit && !formData.password) {
      newErrors.password = "Password is required for new users";
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const dataToSave = { ...formData };
    if (isEdit && !dataToSave.password) {
      delete dataToSave.password;
    }
    onSave(dataToSave);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={isEdit}
            error={!!errors.username}
            helperText={errors.username}
            fullWidth
            required
          />
          <TextField
            label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            helperText={errors.password}
            fullWidth
            required={!isEdit}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={role.label} color={role.color} size="small" />
                    <Typography variant="caption" color="text.secondary">
                      {role.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="Active"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({ open, onClose, user, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete user <strong>{user?.username}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Users Tab
function UsersTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEdit(false);
    setUserDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEdit(true);
    setUserDialogOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (isEdit) {
        await updateUser(selectedUser.username, userData);
      } else {
        await createUser(userData);
      }
      setUserDialogOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteUser(selectedUser.username);
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleChip = (role) => {
    const roleConfig = ROLES.find((r) => r.value === role) || ROLES[3];
    return <Chip label={roleConfig.label} color={roleConfig.color} size="small" />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">User Accounts ({users.length})</Typography>
        <Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadUsers} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleAddUser}>
            Add User
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.username} hover>
                <TableCell>
                  <Typography fontWeight={user.username === currentUser?.username ? 600 : 400}>
                    {user.username}
                    {user.username === currentUser?.username && (
                      <Chip label="You" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>{getRoleChip(user.role)}</TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? "Active" : "Inactive"}
                    color={user.is_active ? "success" : "default"}
                    size="small"
                    variant={user.is_active ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>{formatDate(user.last_login)}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleEditUser(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(user)}
                        disabled={user.username === currentUser?.username}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <UserFormDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        isEdit={isEdit}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        user={selectedUser}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
}

// Audit Logs Tab
function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(100, 0);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  const getActionColor = (action) => {
    if (action.includes("delete")) return "error";
    if (action.includes("create") || action.includes("add")) return "success";
    if (action.includes("update") || action.includes("edit")) return "warning";
    if (action.includes("login")) return "info";
    return "default";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Recent Activity</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadLogs}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No audit logs found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>{log.username}</TableCell>
                  <TableCell>
                    <Chip label={log.action} color={getActionColor(log.action)} size="small" />
                  </TableCell>
                  <TableCell>
                    {log.resource_type && (
                      <Typography variant="body2">
                        {log.resource_type}
                        {log.resource_id && `: ${log.resource_id}`}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.details && (
                      <Tooltip title={JSON.stringify(log.details, null, 2)}>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {JSON.stringify(log.details)}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Company Settings Tab
function CompanySettingsTab() {
  const [settings, setSettings] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_website: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanySettings();
      setSettings({
        company_name: data.company_name || "",
        company_email: data.company_email || "",
        company_phone: data.company_phone || "",
        company_address: data.company_address || "",
        company_website: data.company_website || "",
        logo_url: data.logo_url || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateCompanySettings(settings);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Company settings saved successfully"
      />

      <Typography variant="h6" gutterBottom>
        Company Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This information will be displayed on invoices, emails, and public pages.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <TextField
              label="Company Name"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={settings.company_email}
              onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={settings.company_phone}
              onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address"
              value={settings.company_address}
              onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Website"
              value={settings.company_website}
              onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
              fullWidth
            />
            <TextField
              label="Logo URL"
              value={settings.logo_url}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
              fullWidth
              helperText="Enter a URL to your company logo"
            />
            {settings.logo_url && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Logo Preview:
                </Typography>
                <img
                  src={settings.logo_url}
                  alt="Company logo"
                  style={{ maxWidth: 200, maxHeight: 100 }}
                  onError={(e) => (e.target.style.display = "none")}
                />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
}

// Main Admin Settings Component
function AdminSettings() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);

        // Check if user has admin access
        if (user.role !== "admin") {
          setError("Access denied. Admin privileges required.");
        }
      } catch (err) {
        setError("Failed to load user information");
      } finally {
        setLoading(false);
      }
    };
    loadCurrentUser();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && currentUser?.role !== "admin") {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/products")}>
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/products")}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Admin Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage users, view audit logs, and configure company settings
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Paper sx={{ mx: 2, mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Users" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Audit Logs" />
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Company" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <UsersTab currentUser={currentUser} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AuditLogsTab />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <CompanySettingsTab />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

export default AdminSettings;

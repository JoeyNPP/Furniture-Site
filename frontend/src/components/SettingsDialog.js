import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Typography,
} from "@mui/material";

const SettingsDialog = ({ open, onClose, settings, updateSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [settings, open]);

  const handleThemeChange = (event) => {
    setLocalSettings((prev) => ({ ...prev, theme: event.target.value }));
  };

  const handleTextScaleChange = (event, value) => {
    setLocalSettings((prev) => ({ ...prev, textScale: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Display & Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="settings-theme-label">Theme</InputLabel>
            <Select
              labelId="settings-theme-label"
              value={localSettings.theme}
              label="Theme"
              onChange={handleThemeChange}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Text Scale
            </Typography>
            <Slider
              value={localSettings.textScale}
              min={0.75}
              max={1.5}
              step={0.05}
              valueLabelDisplay="auto"
              onChange={handleTextScaleChange}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;

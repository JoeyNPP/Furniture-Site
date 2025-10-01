import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  Typography
} from "@mui/material";

/**
 * columns: array of { field, headerName, width, etc. }
 * columnVisibilityModel: an object that tracks which columns are visible
 * onColumnVisibilityChange: callback when user toggles a column
 */
const CustomizeColumnsDialog = ({
  open,
  onClose,
  columns = [],
  columnVisibilityModel = {},
  onColumnVisibilityChange
}) => {
  // If columns is empty, prevent .map() errors
  if (!columns.length) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Customize Columns</DialogTitle>
        <DialogContent>
          <Typography>No columns available.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Handle toggling a column???s visibility
  const handleToggleColumn = (field) => {
    const currentlyVisible =
      Object.prototype.hasOwnProperty.call(columnVisibilityModel, field)
        ? !!columnVisibilityModel[field]
        : true;
    const updatedModel = { ...columnVisibilityModel, [field]: !currentlyVisible };
    onColumnVisibilityChange(updatedModel);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Customize Columns</DialogTitle>
      <DialogContent dividers>
        <List>
          {columns.map((col) => (
            <ListItem key={col.field} dense button onClick={() => handleToggleColumn(col.field)}>
              <Checkbox
                checked={
                  Object.prototype.hasOwnProperty.call(columnVisibilityModel, col.field)
                    ? !!columnVisibilityModel[col.field]
                    : true
                }
                tabIndex={-1}
                disableRipple
              />
              <ListItemText primary={col.headerName} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomizeColumnsDialog;


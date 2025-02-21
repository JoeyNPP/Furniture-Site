in_file = r"C:\Users\josep\Documents\NPP_Deals\data\Sanitized_Daily_Deals.csv"
out_file = r"C:\Users\josep\Documents\NPP_Deals\data\Final_Cleaned_Daily_Deals.csv"

# Read the file in raw byte mode
with open(in_file, "rb") as f:
    data = f.read()

# Remove the 0x9D byte
cleaned_data = data.replace(b"\x9d", b"")

# Write the result back as UTF-8
with open(out_file, "wb") as f:
    f.write(cleaned_data)

print("Byte 0x9D removed. Saved as:", out_file)

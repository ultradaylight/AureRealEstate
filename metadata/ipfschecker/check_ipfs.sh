#!/bin/bash

# The base URL to compare against
BASE_URL="https://ipfs.io/ipfs/bafybeicta3gggishp5bk2exs5hr2le4f7ohyp4iyyuk4bmkcuwlpmzuhbq"

# Output file for results
OUTPUT="ipfs_check.txt"
echo "File | Image Base URL Matches" > "$OUTPUT"
echo "--------------------------------" >> "$OUTPUT"

# Loop through all JSON files
for file in *.json; do
    # Extract the image field
    image=$(jq -r '.image' "$file")
    
    # Check if image starts with the base URL
    if [[ "$image" =~ ^"$BASE_URL" ]]; then
        echo "$file | Yes" >> "$OUTPUT"
    else
        echo "$file | No: $image" >> "$OUTPUT"
    fi
done

# Display results
cat "$OUTPUT"

# Count mismatches
mismatches=$(grep -c "No:" "$OUTPUT")
if [ "$mismatches" -eq 0 ]; then
    echo "All files match the base URL!"
else
    echo "Found $mismatches files with different base URLs."
fi

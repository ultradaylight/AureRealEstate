#!/bin/bash

# List of residence types to check
RESIDENCE_TYPES=("Building" "House" "Hotel" "Condo" "Office" "Trailer" "Yacht" "Parking" "Parking Lot" "Storage" "Farm")

# Output file for results
OUTPUT="residence_types.txt"
echo "File | Type of Residence" > "$OUTPUT"
echo "------------------------" >> "$OUTPUT"

# Loop through all JSON files
for file in *.json; do
    # Extract the value for "Type of Residence" from attributes array
    residence=$(jq -r '.attributes[] | select(.trait_type == "Type of Residence") | .value' "$file")
    
    # If residence is found, write it to output
    if [ -n "$residence" ]; then
        echo "$file | $residence" >> "$OUTPUT"
    else
        echo "$file | Not Found" >> "$OUTPUT"
    fi
done

# Display results
echo "Full results written to $OUTPUT"
cat "$OUTPUT"

# Summarize counts for each type (show all, even 0)
echo -e "\nSummary of Residence Types:"
for type in "${RESIDENCE_TYPES[@]}"; do
    count=$(grep -c "| $type$" "$OUTPUT")
    echo "$type: $count files"
done

# Check for types not in the list (case-insensitive check)
echo -e "\nFiles with unexpected residence types:"
grep -v -i -E "Not Found|$(printf "| %s$" "${RESIDENCE_TYPES[@]}" | tr ' ' '|')" "$OUTPUT"

#!/bin/bash

# List of rarity types to check
RARITY_TYPES=("Epic" "Common" "Rare" "Beyond Epic")

# Output file for results
OUTPUT="rarity_check.txt"
echo "File | Rarity" > "$OUTPUT"
echo "-----------------" >> "$OUTPUT"

# Loop through all JSON files
for file in *.json; do
    # Extract the value for "Rarity" from attributes array
    rarity=$(jq -r '.attributes[] | select(.trait_type == "Rarity") | .value' "$file")
    
    # If rarity is found, write it to output
    if [ -n "$rarity" ]; then
        echo "$file | $rarity" >> "$OUTPUT"
    else
        echo "$file | Not Found" >> "$OUTPUT"
    fi
done

# Display results
echo "Full results written to $OUTPUT"
cat "$OUTPUT"

# Summarize counts for each type (show all, even 0)
echo -e "\nSummary of Rarity Types:"
for type in "${RARITY_TYPES[@]}"; do
    count=$(grep -c "| $type$" "$OUTPUT")
    echo "$type: $count files"
done

# Check for types not in the list
echo -e "\nFiles with unexpected rarity types:"
grep -v -E "Not Found|$(printf "| %s$" "${RARITY_TYPES[@]}" | tr ' ' '|')" "$OUTPUT"

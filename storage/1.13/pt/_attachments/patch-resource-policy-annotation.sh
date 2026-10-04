#!/bin/bash

# Script to add helm.sh/resource-policy: keep annotation to CustomResourceDefinitions
# Usage: ./add_helm_keep_annotation.sh <input_file> [output_file]

set -e

# Function to display usage
usage() {
    echo "Usage: $0 <input_file> [backup_suffix]"
    echo "  input_file:    Path to the YAML file containing CRDs"
    echo "  backup_suffix: Suffix for backup file (optional, defaults to 'original')"
    echo ""
    echo "The script will:"
    echo "  1. Backup original file to <input_file>.<backup_suffix>"
    echo "  2. Create modified file as the new <input_file>"
    echo ""
    echo "Examples:"
    echo "  $0 templates/crds.yaml                    # Creates templates/crds.yaml.original"
    echo "  $0 templates/crds.yaml backup             # Creates templates/crds.yaml.backup"
    echo "  $0 templates/crds.yaml 2024-07-24        # Creates templates/crds.yaml.2024-07-24"
    exit 1
}

# Check arguments
if [ $# -lt 1 ]; then
    echo "Error: Input file is required"
    usage
fi

INPUT_FILE="$1"
INPUT_FILENAME="$(basename "$INPUT_FILE")"
BACKUP_SUFFIX="${2:-original}"
BACKUP_FILE="/tmp/${INPUT_FILENAME}.${BACKUP_SUFFIX}"
TEMP_FILE="/tmp/${INPUT_FILENAME}.tmp"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' does not exist"
    exit 1
fi

# Check if backup file already exists
if [ -f "$BACKUP_FILE" ]; then
    echo "Warning: Backup file '$BACKUP_FILE' already exists"
    read -p "Overwrite existing backup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled"
        exit 1
    fi
fi

echo "Processing CRDs in '$INPUT_FILE'..."
echo "Creating backup: '$BACKUP_FILE'"

# Create output file by processing input line by line
{
    in_crd=false
    in_metadata=false
    found_annotations=false

    while IFS= read -r line; do
        # Check if we're starting a new document
        if [[ "$line" =~ ^---[[:space:]]*$ ]]; then
            in_crd=false
            in_metadata=false
            found_annotations=false
        fi

        # Check if this is a CRD
        if [[ "$line" == "kind: CustomResourceDefinition" ]]; then
            in_crd=true
        fi

        # Check if we're in metadata section of a CRD
        if [[ "$line" == "metadata:" ]] && [ "$in_crd" = true ]; then
            in_metadata=true
            found_annotations=false
        fi

        # If we find existing annotations in a CRD, add our annotation
        if [[ "$line" =~ ^[[:space:]]+annotations:[[:space:]]*$ ]] && [ "$in_crd" = true ] && [ "$in_metadata" = true ]; then
            echo "$line"
            echo "    helm.sh/resource-policy: keep"
            found_annotations=true
            continue
        fi

        # If we're in CRD metadata and hit a non-annotation field, add annotations if not found
        if [ "$in_crd" = true ] && [ "$in_metadata" = true ] && [ "$found_annotations" = false ]; then
            if [[ "$line" =~ ^[[:space:]]+[a-zA-Z] ]] && [[ ! "$line" =~ ^[[:space:]]+annotations: ]]; then
                echo "  annotations:"
                echo "    helm.sh/resource-policy: keep"
                found_annotations=true
            fi
        fi

        # If we're leaving metadata section
        if [[ "$line" =~ ^[a-zA-Z]+: ]] && [[ "$line" != "metadata:" ]]; then
            in_metadata=false
        fi

        echo "$line"

    done < "$INPUT_FILE"
} > "$TEMP_FILE"

# If processing was successful, create backup and replace original
if [ -f "$TEMP_FILE" ]; then
    # Create backup of original file
    cp "$INPUT_FILE" "$BACKUP_FILE"

    # Replace original with modified version
    mv "$TEMP_FILE" "$INPUT_FILE"

    echo "Successfully processed the file"
    echo "Original file backed up to: '$BACKUP_FILE'"
    echo "Modified file saved as: '$INPUT_FILE'"

    # Count CRDs and annotations
    crd_count=$(grep -c "kind: CustomResourceDefinition" "$INPUT_FILE" 2>/dev/null || echo 0)
    annotation_count=$(grep -c "helm.sh/resource-policy: keep" "$INPUT_FILE" 2>/dev/null || echo 0)

    echo "Found $crd_count CustomResourceDefinition(s)"
    echo "Added $annotation_count helm.sh/resource-policy: keep annotation(s)"

    # Show file size comparison
    backup_size=$(wc -l < "$BACKUP_FILE")
    current_size=$(wc -l < "$INPUT_FILE")
    echo "Original file: $backup_size lines, Modified file: $current_size lines"

    if [ "$current_size" -lt "$backup_size" ]; then
        echo "Warning: Modified file is smaller than original. Please check the results."
        echo "You can restore from backup: mv '$BACKUP_FILE' '$INPUT_FILE'"
    fi
else
    echo "Error: Failed to create temporary file"
    # Clean up temp file if it exists
    rm -f "$TEMP_FILE"
    exit 1
fi
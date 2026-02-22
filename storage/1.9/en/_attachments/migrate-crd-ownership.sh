#!/bin/bash

# The list of CRDs needs to be changed to reflect your installed Longhorn CRDs.
CRDS=("backingimagedatasources.longhorn.io"
      "backingimagemanagers.longhorn.io"
      "backingimages.longhorn.io"
      "backupbackingimages.longhorn.io"
      "backups.longhorn.io"
      "backuptargets.longhorn.io"
      "backupvolumes.longhorn.io"
      "engineimages.longhorn.io"
      "engines.longhorn.io"
      "instancemanagers.longhorn.io"
      "nodes.longhorn.io"
      "orphans.longhorn.io"
      "recurringjobs.longhorn.io"
      "replicas.longhorn.io"
      "settings.longhorn.io"
      "sharemanagers.longhorn.io"
      "snapshots.longhorn.io"
      "supportbundles.longhorn.io"
      "systembackups.longhorn.io"
      "systemrestores.longhorn.io"
      "volumeattachments.longhorn.io"
      "volumes.longhorn.io")

# Function to update a single CRD
update_crd() {
  local crd=$1
  echo "Processing CRD: $crd"

  # Get the current CRD definition
  kubectl get crd "$crd" -o yaml > temp-crd.yaml

  # Check if the CRD exists
  if [ $? -ne 0 ]; then
    echo "Error: CRD $crd not found"
    rm -f temp-crd.yaml
    return 1
  fi

  # Use sed with cross-platform compatible syntax
  # Create a backup file and replace longhorn-crd with longhorn
  sed -e 's/longhorn-crd/longhorn/g' temp-crd.yaml > temp-crd-updated.yaml

  if [ $? -ne 0 ]; then
    echo "Error: sed command failed for $crd"
    rm -f temp-crd.yaml temp-crd-updated.yaml
    return 1
  fi

  # Move updated file back to original
  mv temp-crd-updated.yaml temp-crd.yaml

  # Apply the updated CRD
  kubectl apply -f temp-crd.yaml

  if [ $? -eq 0 ]; then
    echo "Successfully updated CRD: $crd"
  else
    echo "Error updating CRD: $crd"
  fi

  # Clean up
  rm -f temp-crd.yaml
}

# Main execution
for crd in "${CRDS[@]}"; do
  update_crd "$crd"
done
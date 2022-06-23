#!/bin/bash
set -e

font_dir=~/.local/share/fonts/
mkdir -p $font_dir

# Check if the fonts already exist. Hey, we might be lucky!
if [ -n "$(ls -A /fonts 2>/dev/null)" ]; then
  echo "Fonts seem to exist. If they do not, ensure /fonts dir is empty and try again."
  cp -R /fonts $font_dir
  exit 0
fi

# Read env for the script
if [ -f .env ]; then
  source .env
fi

# Find Azure credentials from secrets if not found from env
if [ -z "$AZURE_FONTS_SAS_URL" ]; then
  # Path to the Azure credentials supplied by Docker secrets
  sas_url=/run/secrets/AZURE_FONTS_SAS_URL

  # Check if the secrets exits, otherwise use just default fonts
  if [ ! -f "$sas_url" ]; then
    echo "Azure sas url not set. Fonts not downloaded."
    exit 0
  fi

  # Read the credentials to envs
  AZURE_FONTS_SAS_URL=$(<$sas_url)
fi

sas_url=${AZURE_FONTS_SAS_URL}

azcopy copy $sas_url $font_dir --recursive=true

echo "Fonts downloaded."

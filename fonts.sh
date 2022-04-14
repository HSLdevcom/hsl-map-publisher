#!/bin/bash
set -e

if [[ $NO_FONTS = "true" ]]; then
  echo "NO_FONTS variable is set to true, using only default fonts."
  exit 0
fi

font_dir=~/.local/share/fonts/opentype
mkdir -p $font_dir

# Check if the fonts already exist. Hey, we might be lucky!
if [ -n "$(ls -A /fonts 2>/dev/null)" ]; then
  echo "Fonts seem to exist. If they do not, ensure /fonts dir is empty and try again."
  cp -R /fonts $font_dir
  exit 0
fi

# Path to the Azure credentials supplied by Docker secrets
key_secret=/run/secrets/AZURE_STORAGE_KEY
account_secret=/run/secrets/AZURE_STORAGE_ACCOUNT

# Check if the credentials exist.

cat ${key_secret}

if [ ! -f "$key_secret" ]; then
  echo "Azure key not set. Fonts not downloaded."
  exit 0
fi

if [ ! -f "$account_secret" ]; then
  echo "Azure account not set. Fonts not downloaded."
  exit 0
fi

# Read the credentials so AZ CLI may use them.
AZURE_STORAGE_KEY=$(<$key_secret)
AZURE_STORAGE_ACCOUNT=$(<$account_secret)

container_name=${AZURE_STORAGE_CONTAINER:=fonts}

az storage blob download-batch --destination $font_dir --source $container_name --pattern *.otf --no-progress --account-name $AZURE_STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY

echo "Fonts downloaded."

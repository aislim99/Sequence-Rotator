#!/bin/bash
# Installs Seq. Rotate for Premiere Pro (macOS). Double-click to run.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/SequenceRotate"
mkdir -p "$DEST"
cp -R "$DIR/CSXS" "$DIR/jsx" "$DIR/index.html" "$DIR/main.js" "$DEST/"
# Allow unsigned extensions
for v in 9 10 11 12 13; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
echo "Installed to: $DEST"
echo "Restart Premiere Pro, then open Window > Extensions > Seq. Rotate."

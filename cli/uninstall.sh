#!/bin/bash

# OmniFocus CLI Uninstaller
BIN_PATH="$HOME/bin/omnifocus"
CONFIG_DIR="$HOME/.config/omnifocus"

echo "🗑️  OmniFocus CLI Uninstaller"
echo ""

# Remove symlink
if [ -e "$BIN_PATH" ] || [ -L "$BIN_PATH" ]; then
    rm "$BIN_PATH"
    echo "✓ Removed $BIN_PATH"
else
    echo "- $BIN_PATH not found (already removed?)"
fi

# Ask about config
if [ -d "$CONFIG_DIR" ]; then
    read -p "Remove config files at $CONFIG_DIR? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$CONFIG_DIR"
        echo "✓ Removed $CONFIG_DIR"
    else
        echo "- Config files kept"
    fi
fi

echo ""
echo "✅ Uninstall complete!"
echo ""

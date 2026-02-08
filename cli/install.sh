#!/bin/bash

# OmniFocus CLI Installer
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_PATH="$SCRIPT_DIR/index.js"
BIN_DIR="$HOME/bin"
BIN_PATH="$BIN_DIR/omnifocus"

echo "🔧 OmniFocus CLI Installer"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Create ~/bin if needed
if [ ! -d "$BIN_DIR" ]; then
    echo "Creating $BIN_DIR..."
    mkdir -p "$BIN_DIR"
fi

# Remove existing symlink/file
if [ -e "$BIN_PATH" ] || [ -L "$BIN_PATH" ]; then
    echo "Removing existing $BIN_PATH..."
    rm "$BIN_PATH"
fi

# Create symlink
echo "Creating symlink: $BIN_PATH -> $CLI_PATH"
ln -s "$CLI_PATH" "$BIN_PATH"
chmod +x "$CLI_PATH"

echo "✓ Symlink created"

# Check if ~/bin is in PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo ""
    echo "⚠️  $BIN_DIR is not in your PATH."
    echo ""
    
    # Detect shell
    SHELL_NAME=$(basename "$SHELL")
    case "$SHELL_NAME" in
        zsh)
            RC_FILE="$HOME/.zshrc"
            ;;
        bash)
            RC_FILE="$HOME/.bashrc"
            ;;
        *)
            RC_FILE="$HOME/.profile"
            ;;
    esac
    
    read -p "Add to $RC_FILE? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        echo '' >> "$RC_FILE"
        echo '# OmniFocus CLI' >> "$RC_FILE"
        echo 'export PATH="$HOME/bin:$PATH"' >> "$RC_FILE"
        echo "✓ Added to $RC_FILE"
        echo ""
        echo "Run: source $RC_FILE"
        echo "Or restart your terminal."
    else
        echo ""
        echo "Add this to your shell config manually:"
        echo '  export PATH="$HOME/bin:$PATH"'
    fi
else
    echo "✓ $BIN_DIR is already in PATH"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. omnifocus configure    # Set up API credentials"
echo "  2. omnifocus help         # See all commands"
echo ""

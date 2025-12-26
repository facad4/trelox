# Icon Generation Instructions

Since this is a development environment, you'll need to generate the PNG icons from the SVG file. Here are a few options:

## Option 1: Using ImageMagick (if installed)
```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate icons
convert icons/icon.svg -resize 16x16 icons/icon-16.png
convert icons/icon.svg -resize 32x32 icons/icon-32.png
convert icons/icon.svg -resize 48x48 icons/icon-48.png
convert icons/icon.svg -resize 128x128 icons/icon-128.png
```

## Option 2: Using Inkscape (if installed)
```bash
# Install Inkscape if not already installed
# macOS: brew install inkscape
# Ubuntu: sudo apt-get install inkscape

# Generate icons
inkscape icons/icon.svg --export-png=icons/icon-16.png --export-width=16 --export-height=16
inkscape icons/icon.svg --export-png=icons/icon-32.png --export-width=32 --export-height=32
inkscape icons/icon.svg --export-png=icons/icon-48.png --export-width=48 --export-height=48
inkscape icons/icon.svg --export-png=icons/icon-128.png --export-width=128 --export-height=128
```

## Option 3: Online Converter
1. Go to an online SVG to PNG converter (e.g., convertio.co, cloudconvert.com)
2. Upload the `icons/icon.svg` file
3. Convert to PNG at sizes: 16x16, 32x32, 48x48, and 128x128
4. Save the files as `icon-16.png`, `icon-32.png`, `icon-48.png`, and `icon-128.png` in the `icons/` directory

## Option 4: Temporary Workaround
For testing purposes, you can temporarily comment out the "icons" section in `manifest.json` if you don't have the PNG files yet. The extension will still work without icons.


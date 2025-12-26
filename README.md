# Trello List Navigator Firefox Extension

A Firefox extension that enhances Trello board navigation by providing a searchable dropdown of all available lists on the current board.

## Features

- **Quick List Search**: Type to search through all lists on the current Trello board
- **Real-time Filtering**: Results update as you type
- **Smooth Navigation**: Click on a list to smoothly scroll it into view
- **Visual Feedback**: Selected lists are briefly highlighted
- **Responsive Design**: Works on desktop and mobile Trello interfaces
- **Auto-sync**: Automatically detects when lists are added, removed, or renamed

## Installation

### From Source

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from this directory

### For Development

The extension will automatically reload when you make changes to the files. You can also manually reload it from the `about:debugging` page.

## Usage

1. Navigate to any Trello board (e.g., `https://trello.com/b/boardId/board-name`)
2. Look for the search input in the board header area(Control+Shift+L)
3. Type the name of the list you want to navigate to
4. Click on the desired list from the dropdown
5. The page will smoothly scroll to bring that list into view

## Technical Details

### Files Structure

- `manifest.json` - Extension configuration and permissions
- `content.js` - Main functionality and DOM interaction
- `styles.css` - UI styling and animations
- `icons/` - Extension icons (placeholder directory)

### How It Works

1. **List Detection**: The extension scans the DOM for Trello list elements using multiple selectors to ensure compatibility
2. **UI Injection**: A search input and dropdown are injected into the Trello board header
3. **Real-time Updates**: A MutationObserver watches for changes to the board structure
4. **Search Filtering**: JavaScript filters the list of available lists based on user input
5. **Navigation**: Uses `scrollIntoView()` to smoothly navigate to the selected list

### Browser Compatibility

- Firefox 57+ (uses Manifest V2)
- Works with Trello's current interface (as of 2024)

### Permissions

- `activeTab` - Required to interact with the current Trello tab
- `*://trello.com/*` - Required to run on Trello domains

## Development

### Testing

1. Load the extension in Firefox
2. Navigate to a Trello board with multiple lists
3. Test the search functionality
4. Verify that list navigation works correctly
5. Test with boards that have many lists (scrolling)

### Debugging

- Use Firefox Developer Tools to inspect the extension's behavior
- Check the Browser Console for any JavaScript errors
- The extension adds elements with class names starting with `trello-nav-`

## Known Limitations

- Only works on Trello.com (not on custom Trello instances)
- Requires JavaScript to be enabled
- May need updates if Trello significantly changes their DOM structure

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.


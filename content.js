// Trello List Navigator Extension
class TrelloListNavigator {
  constructor() {
    this.lists = [];
    this.modal = null;
    this.searchInput = null;
    this.dropdown = null;
    this.button = null;
    this.isInitialized = false;
    this.observer = null;
    this.selectedIndex = -1;
    this.filteredItems = [];
    
    this.init();
  }
  
  init() {
    // Wait for Trello to load
    if (this.isTrelloBoard()) {
      this.setupNavigator();
      this.observeChanges();
    } else {
      // Retry after a short delay
      setTimeout(() => this.init(), 1000);
    }
  }

  isTrelloBoard() {
    const isBoard = window.location.pathname.includes('/b/');
    const hasContainer = document.querySelector('[data-testid="board-lists-container"]');
    
    // Try alternative selectors if the main one doesn't work
    if (isBoard && !hasContainer) {
      const altSelectors = [
        '#board',
        '.board-wrapper',
        '.board-canvas',
        '[data-testid="board"]'
      ];
      
      for (const selector of altSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return true;
        }
      }
    }
    
    return isBoard && hasContainer;
  }
  
  setupNavigator() {
    if (this.isInitialized) return;
    
    this.createUI();
    this.updateLists();
    this.isInitialized = true;
  }
  
  createUI() {
    // Create the main container
    const container = document.createElement('div');
    container.id = 'trello-list-navigator';
    container.className = 'trello-nav-container';
    
    // Create button
    this.button = document.createElement('button');
    this.button.className = 'trello-nav-button';
    this.button.id = 'trello-nav-button';
    this.button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
    this.button.title = 'Search Lists (Ctrl+Shift+L)';
    
    // Add button click event
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showModal();
    });
    
    // Assemble UI
    container.appendChild(this.button);
    
    // Insert into page - find the right location in the header
    const headerSelectors = [
      '[data-testid="board-header"]',
      '.board-header',
      '.board-header-btn-section',
      '.board-top-level',
      '#board'
    ];
    
    let header = null;
    for (const selector of headerSelectors) {
      header = document.querySelector(selector);
      if (header) {
        break;
      }
    }
    
    if (header) {
      // Look for the right side of the header (where buttons usually are)
      const headerRight = header.querySelector('[data-testid="board-header-right"]') ||
                         header.querySelector('.board-header-btn-section') ||
                         header.querySelector('.board-header-btns');
      
      if (headerRight) {
        // Insert at the beginning of the right section
        headerRight.insertBefore(container, headerRight.firstChild);
      } else {
        // Try to find any button container and insert before it
        const buttonContainer = header.querySelector('[data-testid="board-header-right"]') ||
                               header.querySelector('.board-header-btn-section') ||
                               header.querySelector('[class*="button"]') ||
                               header.querySelector('[class*="btn"]');
        
        if (buttonContainer) {
          buttonContainer.parentNode.insertBefore(container, buttonContainer);
        } else {
          // Last resort: append to header with margin
          container.style.marginLeft = 'auto';
          container.style.marginRight = '12px';
          header.appendChild(container);
        }
      }
    } else {
      document.body.appendChild(container);
    }
    
    // Add global keyboard shortcut
    this.addGlobalShortcut();
    
    // Create modal (but don't show it yet)
    this.createModal();
  }
  
  createModal() {
    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'trello-nav-modal';
    this.modal.id = 'trello-nav-modal';
    // Modal starts hidden by default via CSS
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'trello-nav-modal-content';
    
    // Create search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = '🔍 Search Trello Lists...';
    this.searchInput.className = 'trello-nav-modal-search';
    this.searchInput.id = 'trello-nav-modal-search-input';
    
    // Create dropdown for modal
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'trello-nav-modal-dropdown';
    this.dropdown.id = 'trello-nav-modal-dropdown';
    
    // Add event listeners
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Close modal when clicking overlay
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        e.preventDefault();
        e.stopPropagation();
        this.hideModal();
      }
    });
    
    // Prevent modal content clicks from closing the modal
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Assemble modal
    modalContent.appendChild(this.searchInput);
    modalContent.appendChild(this.dropdown);
    this.modal.appendChild(modalContent);
    
    // Append to body
    document.body.appendChild(this.modal);
  }
  
  showModal() {
    if (!this.modal) return;
    
    // Update lists before showing
    this.updateLists();
    
    // Show modal using CSS class
    this.modal.classList.add('show');
    
    // Focus search input
    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 100);
    
    // Show all lists initially
    this.renderDropdown();
  }
  
  hideModal() {
    if (!this.modal) return;
    
    // Hide modal using CSS class
    this.modal.classList.remove('show');
    this.searchInput.value = '';
    this.selectedIndex = -1;
  }

  updateLists() {
    this.lists = this.extractLists();
    this.renderDropdown();
  }
  
  extractLists() {
    const lists = [];
    
    // Try multiple selectors for Trello lists
    const listSelectors = [
      '[data-testid="list"]',
      '.list-wrapper',
      '.js-list',
      '[data-list-id]',
      '.list',
      '[data-rbd-droppable-id]'
    ];
    
    let listElements = [];
    for (const selector of listSelectors) {
      listElements = document.querySelectorAll(selector);
      if (listElements.length > 0) break;
    }
    
    listElements.forEach((listElement, index) => {
      // Try multiple selectors for list titles
      const titleSelectors = [
        '[data-testid="list-name"]',
        '.list-header-name',
        '.js-list-name-input',
        'h2',
        '.list-header-name-assist',
        '[data-testid="list-header"] textarea',
        '[data-testid="list-header"] h2',
        'textarea[data-testid="list-name-textarea"]'
      ];
      
      let titleElement = null;
      let title = '';
      
      for (const selector of titleSelectors) {
        titleElement = listElement.querySelector(selector);
        if (titleElement) {
          title = titleElement.textContent.trim() || titleElement.value?.trim() || '';
          if (title) break;
        }
      }
      
      if (title) {
        lists.push({
          title: title,
          element: listElement,
          index: index
        });
      }
    });
    
    return lists;
  }
  
  renderDropdown() {
    if (!this.dropdown) return;
    
    this.dropdown.innerHTML = '';
    
    if (this.lists.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'trello-nav-item trello-nav-no-results';
      noResults.textContent = 'No lists found';
      this.dropdown.appendChild(noResults);
      return;
    }
    
    this.lists.forEach((list) => {
      const item = document.createElement('div');
      item.className = 'trello-nav-item';
      item.textContent = list.title;
      item.addEventListener('click', () => this.selectList(list));
      this.dropdown.appendChild(item);
    });
  }
  
  handleSearch(event) {
    const query = event.target.value.toLowerCase();
    
    // Make sure we have up-to-date lists
    if (this.lists.length === 0) {
      this.updateLists();
    }
    
    const items = this.dropdown.querySelectorAll('.trello-nav-item');
    
    let hasVisibleItems = false;
    this.filteredItems = [];
    
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const matches = text.includes(query);
      item.style.display = matches ? 'block' : 'none';
      if (matches && !item.classList.contains('trello-nav-no-results')) {
        hasVisibleItems = true;
        this.filteredItems.push(item);
      }
    });
    
    // Auto-select if only one result
    if (this.filteredItems.length === 1) {
      this.selectedIndex = 0;
    } else {
      this.selectedIndex = -1;
    }
    this.updateSelection();
    
    // Show "No results" if no items match
    if (!hasVisibleItems && query.length > 0) {
      let noResults = this.dropdown.querySelector('.trello-nav-no-results');
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'trello-nav-item trello-nav-no-results';
        noResults.textContent = 'No matching lists found';
        this.dropdown.appendChild(noResults);
      }
      noResults.style.display = 'block';
    } else {
      const noResults = this.dropdown.querySelector('.trello-nav-no-results');
      if (noResults) {
        noResults.style.display = 'none';
      }
    }
  }
  
  handleKeydown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.updateSelection();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
        
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredItems.length) {
          const selectedItem = this.filteredItems[this.selectedIndex];
          const listTitle = selectedItem.textContent;
          const list = this.lists.find(l => l.title === listTitle);
          if (list) {
            this.selectList(list);
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.hideModal();
        break;
    }
  }
  
  updateSelection() {
    // Remove previous selection
    this.filteredItems.forEach(item => item.classList.remove('selected'));
    
    // Add selection to current item
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredItems.length) {
      this.filteredItems[this.selectedIndex].classList.add('selected');
      
      // Scroll into view if needed
      this.filteredItems[this.selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }
  
  addGlobalShortcut() {
    // Only handle the Ctrl+Shift+L shortcut here
    // The 'n' key handler is set up dynamically in setupDirectCardCreation
    document.addEventListener('keydown', (event) => {
      // Check for Ctrl+Shift+L to open modal
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        this.showModal();
        return;
      }
    });
  }
  
  selectList(list) {
    // Clear search input and hide modal
    this.searchInput.value = '';
    this.hideModal();
    
    // Small delay to ensure modal closes before scrolling
    setTimeout(() => {
      // Scroll to the selected list
      this.scrollToList(list.element);
      
      // Highlight the list (no notification)
      this.highlightList(list.element);
    }, 100);
  }
  
  
  scrollToList(listElement) {
    if (!listElement) return;
    
    // First scroll the list into view
    listElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
    
    // Then scroll the list content to the end/bottom with multiple attempts
    setTimeout(() => {
      this.scrollListToEnd(listElement);
    }, 300); // Initial attempt
    
    setTimeout(() => {
      this.scrollListToEnd(listElement);
    }, 800); // Second attempt after scroll completes
    
    setTimeout(() => {
      this.scrollListToEnd(listElement);
    }, 1200); // Final attempt to ensure it worked
    
    // Try multiple approaches to focus the list for Trello's keyboard shortcuts
    this.focusListForKeyboardShortcuts(listElement);
  }
  
  scrollListToEnd(listElement) {
    // Find the scrollable container within the list (the cards container)
    const scrollableSelectors = [
      '[data-testid="list-cards"]',
      '.list-cards',
      '.js-list-cards',
      '.list-card-details',
      '.list-card-composer-container',
      '[data-rbd-droppable-id] > div',
      '.js-card-composer-container',
      '[data-testid="list"] > div:last-child',
      '.js-list-content'
    ];
    
    let scrollContainer = null;
    
    // Try to find the scrollable container
    for (const selector of scrollableSelectors) {
      scrollContainer = listElement.querySelector(selector);
      if (scrollContainer) break;
    }
    
    // If no specific container found, try to find any scrollable element within the list
    if (!scrollContainer) {
      const allDivs = listElement.querySelectorAll('div');
      for (const div of allDivs) {
        if (div.scrollHeight > div.clientHeight) {
          scrollContainer = div;
          break;
        }
      }
    }
    
    // If still no container found, use the list element itself
    if (!scrollContainer) {
      scrollContainer = listElement;
    }
    
    // Scroll to the bottom of the container
    if (scrollContainer) {
      // Try multiple scroll methods for better compatibility
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
      
      // Fallback method
      setTimeout(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, 100);
    }
    
    // Alternative approach: find and scroll to the "Add a card" button
    const addCardSelectors = [
      '[data-testid="list-add-card-button"]',
      '.js-add-a-card',
      '.list-card-composer-textarea',
      '.js-card-composer',
      '[data-testid="list-footer"]',
      '.list-footer'
    ];
    
    for (const selector of addCardSelectors) {
      const addCardElement = listElement.querySelector(selector);
      if (addCardElement) {
        setTimeout(() => {
          addCardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }, 200);
        break;
      }
    }
  }
  
  focusListForKeyboardShortcuts(listElement) {
    // Clear any existing focus first
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Remove focus from any other lists
    document.querySelectorAll('[data-testid="list"]').forEach(list => {
      list.classList.remove('trello-nav-active-list');
      list.removeAttribute('data-trello-nav-selected');
    });
    
    // Mark this list as selected
    listElement.classList.add('trello-nav-active-list');
    listElement.setAttribute('data-trello-nav-selected', 'true');
    
    // Try multiple approaches to activate the list for Trello's keyboard shortcuts
    this.activateListForTrello(listElement);
  }
  
  activateListForTrello(listElement) {
    // Clear any existing focus and selection
    if (document.activeElement) {
      document.activeElement.blur();
    }
    
    // Store reference to this list for card creation
    this.currentSelectedList = listElement;
    
    // Strategy 1: Direct interaction with the list to ensure Trello recognizes it
    this.ensureTrelloListSelection(listElement);
    
    // Strategy 2: Set up our own keyboard handler that directly creates cards in this list
    this.setupDirectCardCreation(listElement);
  }
  
  ensureTrelloListSelection(listElement) {
    // Multiple approaches to ensure Trello recognizes this list as selected
    
    // 1. Click on the list header to activate it
    const listHeader = listElement.querySelector('[data-testid="list-header"]') || 
                      listElement.querySelector('.list-header') ||
                      listElement.querySelector('[data-testid="list-name"]');
    
    if (listHeader) {
      // Simulate a real user click
      const rect = listHeader.getBoundingClientRect();
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 0
      });
      listHeader.dispatchEvent(clickEvent);
    }
    
    // 2. Focus the list container
    if (listElement.tabIndex === -1) {
      listElement.tabIndex = 0;
    }
    listElement.focus();
    
    // 3. Try to focus any existing "Add a card" button
    setTimeout(() => {
      const addCardButton = this.findAddCardButton(listElement);
      if (addCardButton) {
        addCardButton.focus();
      }
    }, 100);
  }
  
  setupDirectCardCreation(listElement) {
    // Remove any existing handlers
    if (this.globalKeyHandler) {
      document.removeEventListener('keydown', this.globalKeyHandler);
    }
    
    // Create a new global handler that specifically targets this list
    this.globalKeyHandler = (event) => {
      if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Only handle if no input is focused
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA' &&
            !document.activeElement.isContentEditable) {
          event.preventDefault();
          event.stopPropagation();
          this.createCardInSpecificList(listElement);
        }
      }
    };
    
    document.addEventListener('keydown', this.globalKeyHandler);
  }
  
  createCardInSpecificList(listElement) {
    // Find the "Add a card" button in this specific list
    const addCardButton = this.findAddCardButton(listElement);
    
    if (addCardButton) {
      // Click the button directly
      addCardButton.click();
      return true;
    }
    
    // If no button found, try alternative methods
    return this.createCardComposer(listElement);
  }
  
  findAddCardButton(listElement) {
    const addCardSelectors = [
      '[data-testid="list-add-card-button"]',
      '.list-card-composer-container button',
      '.js-add-a-card',
      '[aria-label*="Add a card"]',
      '.open-card-composer',
      '.list-card-composer-container .js-add-card',
      '.list-footer button',
      'button[data-testid="list-add-card-button"]',
      '.list-footer .js-add-a-card'
    ];
    
    for (const selector of addCardSelectors) {
      const button = listElement.querySelector(selector);
      if (button && button.offsetParent !== null && !button.disabled) {
        return button;
      }
    }
    
    return null;
  }
  
  
  createCardInList(listElement) {
    // Use the specific list if provided, otherwise use the currently selected one
    const targetList = listElement || this.currentSelectedList;
    if (!targetList) return false;
    
    return this.createCardInSpecificList(targetList);
  }
  
  createCardComposer(listElement) {
    // Look for areas where we can trigger the card composer
    const clickTargets = [
      listElement.querySelector('.list-footer'),
      listElement.querySelector('[data-testid="list-cards"]'),
      listElement.querySelector('.list-cards'),
      listElement.querySelector('.list-card-composer-container')
    ];
    
    for (const target of clickTargets) {
      if (target) {
        // Try clicking to open card composer
        const rect = target.getBoundingClientRect();
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + rect.width / 2,
          clientY: rect.bottom - 10 // Click near the bottom
        });
        target.dispatchEvent(clickEvent);
        
        // Also try double-click as some versions might need it
        setTimeout(() => {
          const dblClickEvent = new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.bottom - 10
          });
          target.dispatchEvent(dblClickEvent);
        }, 50);
        
        return true;
      }
    }
    
    return false;
  }
  
  
  highlightList(listElement) {
    if (!listElement) return;
    
    // Remove any existing highlights first
    document.querySelectorAll('.trello-nav-highlighted').forEach(el => {
      el.classList.remove('trello-nav-highlighted');
    });
    
    // Add simple highlight class to the selected list (thin frame only)
    listElement.classList.add('trello-nav-highlighted');
    
    // Keep highlight visible for longer duration
    setTimeout(() => {
      listElement.classList.remove('trello-nav-highlighted');
    }, 10000); // Keep highlight for 10 seconds (longer since no animation)
  }
  
  observeChanges() {
    // Watch for changes in the board (new lists, renamed lists, etc.)
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        // Check if lists were added/removed/modified
        if (mutation.type === 'childList' || 
            (mutation.type === 'attributes' && 
             mutation.attributeName === 'data-list-id')) {
          shouldUpdate = true;
        }
        
        // Check for text changes in list names
        if (mutation.type === 'characterData' || 
            (mutation.target && mutation.target.closest && 
             mutation.target.closest('[data-testid="list-name"]'))) {
          shouldUpdate = true;
        }
      });
      
      if (shouldUpdate) {
        // Debounce updates
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          this.updateLists();
        }, 500);
      }
    });
    
    // Start observing
    const boardContainer = document.querySelector('[data-testid="board-lists-container"]') ||
                          document.querySelector('#board') ||
                          document.body;
    
    if (boardContainer) {
      this.observer.observe(boardContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    }
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Clean up global keyboard handler
    if (this.globalKeyHandler) {
      document.removeEventListener('keydown', this.globalKeyHandler);
    }
    
    // Clear current selection
    this.currentSelectedList = null;
    
    const container = document.getElementById('trello-list-navigator');
    if (container) {
      container.remove();
    }
    
    const modal = document.getElementById('trello-nav-modal');
    if (modal) {
      modal.remove();
    }
    
    this.isInitialized = false;
  }
}

// Initialize the extension
let navigator = null;

function initializeExtension() {
  // Clean up existing instance
  if (navigator) {
    navigator.destroy();
  }
  
  // Create new instance
  navigator = new TrelloListNavigator();
}

// Handle page navigation (Trello is a SPA)
let currentUrl = window.location.href;

function handleUrlChange() {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    
    // Reinitialize if we're on a board page
    setTimeout(() => {
      initializeExtension();
    }, 1000);
  }
}

// Listen for URL changes
window.addEventListener('popstate', handleUrlChange);

// Override pushState and replaceState to catch programmatic navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(history, args);
  handleUrlChange();
};

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  handleUrlChange();
};

// Initialize when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
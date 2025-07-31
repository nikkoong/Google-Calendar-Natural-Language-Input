console.log('Google Calendar Natural Language Input - Content script loaded');

// Wait for Google Calendar to fully load
function waitForCalendarLoad() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // Try for 30 seconds
    
    // Check if we're on the calendar page and if the create button exists
    const checkForCreateButton = () => {
      attempts++;
      console.log(`Attempt ${attempts}: Looking for create button...`);
      
      // Debug: Log all potential buttons for analysis
      const allButtons = document.querySelectorAll('button');
      console.log(`Found ${allButtons.length} buttons on page`);
      
      // Try multiple selectors to find Google Calendar's create button
      const selectors = [
        '[data-action-menu="true"]',
        '[aria-label*="Create"]',
        '[aria-label*="create"]', 
        '[title*="Create"]',
        '[title*="create"]',
        'button[jsaction*="create"]',
        '[data-tooltip*="Create"]',
        '[data-tooltip*="create"]',
        'button[aria-haspopup="true"]',
        'button[data-test-id*="create"]',
        'button[id*="create"]',
        'button[class*="create"]',
        '.gb_A', // Common Google apps button class
        '[role="button"][aria-label*="Create"]',
        '[role="button"][aria-label*="create"]'
      ];
      
      let createButton = null;
      
      for (const selector of selectors) {
        createButton = document.querySelector(selector);
        if (createButton) {
          console.log(`Create button found with selector: ${selector}`, createButton);
          break;
        }
      }
      
      // If no button found with selectors, look for buttons containing "Create" text
      if (!createButton) {
        for (const button of allButtons) {
          const text = button.textContent?.toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          const title = button.getAttribute('title')?.toLowerCase() || '';
          
          if (text.includes('create') || ariaLabel.includes('create') || title.includes('create')) {
            console.log('Found potential create button by text/aria:', button);
            createButton = button;
            break;
          }
        }
      }
      
      if (createButton) {
        console.log('Create button found:', createButton);
        console.log('Button attributes:', {
          id: createButton.id,
          className: createButton.className,
          ariaLabel: createButton.getAttribute('aria-label'),
          title: createButton.getAttribute('title'),
          textContent: createButton.textContent
        });
        resolve(createButton);
      } else {
        console.log('Create button not found, retrying...');
        
        if (attempts >= maxAttempts) {
          console.error('Max attempts reached. Could not find create button.');
          // Log page info for debugging
          console.log('Current URL:', window.location.href);
          console.log('Page title:', document.title);
          console.log('Is calendar page?', window.location.href.includes('calendar.google.com'));
          reject(new Error('Create button not found after maximum attempts'));
        } else {
          setTimeout(checkForCreateButton, 1000);
        }
      }
    };
    
    checkForCreateButton();
  });
}

// Apply visual indicators and create Quick Add button
function setupQuickAddButton(createButton) {
  // Check if Quick Add button already exists
  const existingQuickAdd = document.querySelector('.quick-add-button');
  if (existingQuickAdd && existingQuickAdd.isConnected) {
    console.log('Quick Add button already exists and is connected, skipping creation');
    return existingQuickAdd;
  }
  
  // Remove any disconnected Quick Add buttons
  document.querySelectorAll('.quick-add-button').forEach(btn => {
    if (!btn.isConnected) {
      btn.remove();
    }
  });
  
  // Create the Quick Add button
  const quickAddButton = document.createElement('button');
  quickAddButton.className = 'quick-add-button';
  quickAddButton.setAttribute('data-quick-add-active', 'true');
  quickAddButton.setAttribute('aria-label', 'Quick Add Event using natural language');
  quickAddButton.title = 'Quick Add Event';
  
  // Style the button to match Google Calendar's create button
  quickAddButton.style.cssText = `
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin-left: 18px !important;
    padding: 6px !important;
    background: #4285f4 !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    height: 22px !important;
    min-width: auto !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15) !important;
    position: relative !important;
    z-index: 1000 !important;
    user-select: none !important;
  `;
  
  // Add content with icon and text
  quickAddButton.innerHTML = `
    <span style="margin-right: 3px; font-size: 14px; line-height: 1;">⚡</span>
    <span>Quick Add</span>
  `;
  
  // Add hover effects that match Google's style
  quickAddButton.addEventListener('mouseenter', () => {
    quickAddButton.style.backgroundColor = '#3367d6 !important';
    quickAddButton.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15) !important';
  });
  
  quickAddButton.addEventListener('mouseleave', () => {
    quickAddButton.style.backgroundColor = '#4285f4 !important';
    quickAddButton.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15) !important';
  });
  
  // Add click handler
  quickAddButton.addEventListener('click', handleQuickAddClick);
  
  // Try multiple insertion strategies
  const insertButton = () => {
    const createButtonContainer = createButton.parentElement;
    if (createButtonContainer && createButton.isConnected) {
      // Strategy 1: Insert as sibling
      try {
        if (createButton.nextSibling) {
          createButtonContainer.insertBefore(quickAddButton, createButton.nextSibling);
        } else {
          createButtonContainer.appendChild(quickAddButton);
        }
        console.log('Quick Add button inserted as sibling');
        return true;
      } catch (error) {
        console.log('Sibling insertion failed:', error);
      }
      
      // Strategy 2: Append to container
      try {
        createButtonContainer.appendChild(quickAddButton);
        console.log('Quick Add button appended to container');
        return true;
      } catch (error) {
        console.log('Container append failed:', error);
      }
    }
    
    // Strategy 3: Insert into a higher-level container
    const higherContainer = createButton.closest('[role="main"]') || 
                           createButton.closest('.gb_tc') ||
                           createButton.closest('div');
    if (higherContainer) {
      try {
        higherContainer.appendChild(quickAddButton);
        console.log('Quick Add button inserted into higher container');
        return true;
      } catch (error) {
        console.log('Higher container insertion failed:', error);
      }
    }
    
    return false;
  };
  
  if (insertButton()) {
    // Set up a watcher to re-insert if removed
    const reconnectButton = () => {
      if (!quickAddButton.isConnected && createButton.isConnected) {
        console.log('Quick Add button disconnected, reconnecting...');
        if (insertButton()) {
          console.log('Quick Add button reconnected successfully');
        }
      }
    };
    
    // Check every 500ms if button is still connected
    const reconnectInterval = setInterval(() => {
      if (!createButton.isConnected) {
        clearInterval(reconnectInterval);
        return;
      }
      reconnectButton();
    }, 500);
    
    return quickAddButton;
  } else {
    console.error('All insertion strategies failed');
    return null;
  }
}

// Handle Quick Add button click
function handleQuickAddClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('Quick Add button clicked!');
  
  // Check if input container already exists
  let inputContainer = document.querySelector('.quick-event-input-container');
  
  if (inputContainer) {
    // If it exists and is visible, hide it
    if (inputContainer.classList.contains('show')) {
      hideQuickEventInput();
      return;
    } else {
      // If it exists but is hidden, show it
      showQuickEventInput();
      return;
    }
  }
  
  // Create the input container
  inputContainer = createQuickEventInput();
  
  // Position it relative to the Quick Add button
  const quickAddButton = event.target.closest('.quick-add-button');
  if (quickAddButton) {
    positionInputContainer(inputContainer, quickAddButton);
  }
  
  // Add to DOM and show
  document.body.appendChild(inputContainer);
  showQuickEventInput();
}

// Create the Quick Event input UI
function createQuickEventInput() {
  const container = document.createElement('div');
  container.className = 'quick-event-input-container';
  
  container.innerHTML = `
    <div class="quick-event-header">
      <h3 class="quick-event-title">Quick Add Event</h3>
      <button class="quick-event-close" title="Close">×</button>
    </div>
    
    <input 
      type="text" 
      class="quick-event-input" 
      placeholder="Lunch next Tuesday at 1"
      aria-label="Enter event details in natural language"
    />
    
    <div class="quick-event-help">
      d(description) - l(location) - multiple events (;) - recurrences "every N days/weeks/etc"
      </div>
    
    <div class="quick-event-loading">
      <div class="quick-event-spinner"></div>
      <span>Creating event...</span>
    </div>
    
    <div class="quick-event-actions">
      <button class="quick-event-btn quick-event-btn-secondary" id="quick-event-cancel">
        Cancel
      </button>
      <button class="quick-event-btn quick-event-btn-secondary" id="quick-event-help">
                Help
      </button>
      <button class="quick-event-btn quick-event-btn-primary" id="quick-event-create" disabled>
        Create Event(s)
      </button>
    </div>
  `;
  
  // Add event listeners
  setupQuickEventListeners(container);
  
  return container;
}

// Set up event listeners for the input UI
function setupQuickEventListeners(container) {
  const input = container.querySelector('.quick-event-input');
  const createBtn = container.querySelector('#quick-event-create');
  const cancelBtn = container.querySelector('#quick-event-cancel');
  const helpBtn = container.querySelector('#quick-event-help');
  const closeBtn = container.querySelector('.quick-event-close');
  
  // Input event listener for enabling/disabling create button
  input.addEventListener('input', (e) => {
    const hasText = e.target.value.trim().length > 0;
    createBtn.disabled = !hasText;
  });
  
  // Enter key to create event
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !createBtn.disabled) {
      e.preventDefault();
      handleCreateEvent(input.value.trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideQuickEventInput();
    }
  });
  
  // Create button click
  createBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!createBtn.disabled) {
      handleCreateEvent(input.value.trim());
    }
  });
  
  // Cancel button click
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideQuickEventInput();
  });
  
  // Help button click
  helpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showHelp();
  });
  
  // Close button click
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideQuickEventInput();
  });
  
  // Click outside to close
  document.addEventListener('click', handleClickOutside);
}

// Handle click outside to close input
function handleClickOutside(e) {
  const container = document.querySelector('.quick-event-input-container');
  const quickAddButton = document.querySelector('.quick-add-button');
  
  if (container && container.classList.contains('show')) {
    // Don't close if clicking inside container or on the Quick Add button
    if (!container.contains(e.target) && !quickAddButton.contains(e.target)) {
      hideQuickEventInput();
    }
  }
}

// Position input container relative to Quick Add button
function positionInputContainer(container, button) {
  const buttonRect = button.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Default position: below and aligned with button
  let top = buttonRect.bottom + window.scrollY + 8;
  let left = buttonRect.left + window.scrollX;
  
  // Adjust if container would go off-screen horizontally
  const containerWidth = 320; // Approximate width
  if (left + containerWidth > viewportWidth) {
    left = viewportWidth - containerWidth - 16; // 16px margin from edge
  }
  
  // Adjust if container would go off-screen vertically
  const containerHeight = 200; // Approximate height
  if (top + containerHeight > viewportHeight + window.scrollY) {
    // Position above the button instead
    top = buttonRect.top + window.scrollY - containerHeight - 8;
  }
  
  // Ensure minimum margins
  left = Math.max(16, left);
  top = Math.max(16, top);
  
  container.style.position = 'absolute';
  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
}

// Show the Quick Event input
function showQuickEventInput() {
  const container = document.querySelector('.quick-event-input-container');
  if (container) {
    container.classList.add('show');
    const input = container.querySelector('.quick-event-input');
    if (input) {
      // Focus input after animation starts
      setTimeout(() => {
        input.focus();
      }, 50);
    }
  }
}

// Hide the Quick Event input
function hideQuickEventInput() {
  const container = document.querySelector('.quick-event-input-container');
  if (container) {
    container.classList.remove('show');
    
    // Clear input and reset state
    const input = container.querySelector('.quick-event-input');
    const createBtn = container.querySelector('#quick-event-create');
    const loading = container.querySelector('.quick-event-loading');
    
    if (input) input.value = '';
    if (createBtn) createBtn.disabled = true;
    if (loading) loading.classList.remove('show');
    
    // Remove click outside listener when hidden
    document.removeEventListener('click', handleClickOutside);
    
    // Remove container after animation
    setTimeout(() => {
      if (container && !container.classList.contains('show')) {
        container.remove();
      }
    }, 200);
  }
}

// Show help information
function showHelp() {
  // Check if help modal already exists
  let helpModal = document.querySelector('.quick-event-help-modal');
  if (helpModal) {
    helpModal.remove();
  }

  // Create help modal
  helpModal = document.createElement('div');
  helpModal.className = 'quick-event-help-modal';
  
  helpModal.innerHTML = `
    <div class="quick-event-help-overlay"></div>
    <div class="quick-event-help-content">
      <div class="quick-event-help-header">
        <h3 class="quick-event-help-title">Natural Language Event Creation Help</h3>
        <button class="quick-event-help-close" title="Close">×</button>
      </div>
      
      <div class="quick-event-help-body">
        <div class="quick-event-help-section">
          <h4>Basic Examples:</h4>
          <ul>
            <li>"Clean the house tomorrow 2pm"</li>
            <li>"Lunch Friday 1pm to 2pm"</li>
            <li>"Doctor appointment next Monday 10am"</li>
          </ul>
        </div>

        <div class="quick-event-help-section">
          <h4>Advanced Features:</h4>
          <ul>
            <li><strong>Descriptions:</strong> "Meeting d(discuss project timeline)"</li>
            <li><strong>Locations:</strong> "Dinner l(Applebees)"</li>
            <li><strong>Recurring:</strong> "Team standup every Monday 9-915am"</li>
            <li><strong>Multiple events:</strong> "Jam session 1pm; Carlos Birthday 5pm every year"</li>
          </ul>
        </div>

        <div class="quick-event-help-section">
          <h4>Time Formats:</h4>
          <ul>
            <li>"tomorrow", "next week", "Friday"</li>
            <li>"2pm", "19:40", "2:30pm"</li>
            <li>"10am to 5pm", "9am-10am"</li>
          </ul>
        </div>

        <div class="quick-event-help-section">
          <h4>Recurrence Patterns:</h4>
          <ul>
            <li>"every day", "every week", "every month"</li>
            <li>"every Monday", "every 2 weeks"</li>
          </ul>
        </div>
      </div>
      
      <div class="quick-event-help-footer">
        <button class="quick-event-btn quick-event-btn-primary quick-event-help-got-it">
          Got it!
        </button>
      </div>
    </div>
  `;

  // Add event listeners
  const closeBtn = helpModal.querySelector('.quick-event-help-close');
  const gotItBtn = helpModal.querySelector('.quick-event-help-got-it');
  const overlay = helpModal.querySelector('.quick-event-help-overlay');

  const closeHelp = () => {
    helpModal.remove();
  };

  closeBtn.addEventListener('click', closeHelp);
  gotItBtn.addEventListener('click', closeHelp);
  overlay.addEventListener('click', closeHelp);

  // Escape key to close
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeHelp();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Add to DOM and show
  document.body.appendChild(helpModal);
  
  // Animate in
  requestAnimationFrame(() => {
    helpModal.classList.add('show');
  });
}

// Handle event creation
function handleCreateEvent(eventText) {
  if (!eventText) return;
  
  const container = document.querySelector('.quick-event-input-container');
  const loading = container?.querySelector('.quick-event-loading');
  const actions = container?.querySelector('.quick-event-actions');
  
  // Show loading state
  if (loading) loading.classList.add('show');
  if (actions) actions.style.display = 'none';
  
  try {
    if (!window.GoogleCalendarNLP) {
      throw new Error('Natural language processing not available');
    }
    
    console.log('Processing event text:', eventText);
    
    // Generate event URLs
    const eventUrls = window.GoogleCalendarNLP.createEventUrls(eventText);
    
    if (eventUrls && eventUrls.length > 0) {
      console.log('Generated event URLs:', eventUrls);
      
      // Navigate to the first event URL
      window.location.href = eventUrls[0];
      
      // Hide input after short delay
      setTimeout(() => {
        hideQuickEventInput();
      }, 500);
      
    } else {
      throw new Error('Could not generate event from the provided text');
    }
    
  } catch (error) {
    console.error('Error creating event:', error);
    
    // Hide loading and show error
    if (loading) loading.classList.remove('show');
    if (actions) actions.style.display = 'flex';
    
    // Show error message (simple alert for now, can be enhanced later)
    alert(`Error creating event: ${error.message}\n\nPlease try a different format, like:\n"Meeting tomorrow 2pm"\n"Lunch Friday 1pm to 2pm"`);
  }
}

// Set up mutation observer to maintain our Quick Add button
function setupMutationObserver(createButton, quickAddButton) {
  let isApplyingStyle = false; // Flag to prevent infinite loops
  
  const observer = new MutationObserver((mutations) => {
    // Skip if we're currently applying styles to avoid infinite loops
    if (isApplyingStyle) return;
    
    let needsReapply = false;
    
    mutations.forEach((mutation) => {
      // Check if our Quick Add button was removed
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach((node) => {
          if (node === quickAddButton || (node.classList && node.classList.contains('quick-add-button'))) {
            console.log('Quick Add button was removed, need to recreate');
            needsReapply = true;
          }
        });
      }
      
      // Check if the create button was replaced
      if (mutation.type === 'childList' && mutation.target !== createButton) {
        mutation.removedNodes.forEach((node) => {
          if (node === createButton || (node.nodeType === 1 && node.contains && node.contains(createButton))) {
            console.log('Create button was removed from DOM, need to find it again');
            needsReapply = true;
          }
        });
      }
    });
    
    if (needsReapply) {
      console.log('DOM change detected, reapplying Quick Add button...');
      isApplyingStyle = true;
      setTimeout(() => {
        if (createButton && createButton.isConnected) {
          setupQuickAddButton(createButton);
        } else {
          console.log('Create button no longer connected, reinitializing...');
          reinitialize();
        }
        isApplyingStyle = false;
      }, 100);
    }
  });
  
  // Watch the create button's parent container for changes
  const parentContainer = createButton.closest('[role="main"], .gb_A, .gb_wa, .gb_tc') || createButton.parentElement;
  if (parentContainer) {
    observer.observe(parentContainer, {
      childList: true,
      subtree: true
    });
  }
  
  console.log('Mutation observer set up for Quick Add button maintenance');
  return observer;
}

// Reinitialize if button gets replaced
async function reinitialize() {
  try {
    console.log('Reinitializing extension...');
    const newCreateButton = await waitForCalendarLoad();
    const quickAddButton = setupQuickAddButton(newCreateButton);
    if (quickAddButton) {
      setupMutationObserver(newCreateButton, quickAddButton);
    }
    console.log('Extension reinitialized with new button');
  } catch (error) {
    console.error('Failed to reinitialize:', error);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle create button click
function handleCreateButtonClick(event) {
  console.log('Create button clicked, monitoring for dropdown...');
  
  // Small delay to allow dropdown to appear
  setTimeout(() => {
    const dropdown = findDropdownInDocument();
    if (dropdown) {
      console.log('Found dropdown after button click');
      injectQuickEventOption(dropdown);
    }
  }, 100);
}

// Find dropdown container in the document
function findDropdownInDocument() {
  // Try multiple selectors for Google Calendar dropdown
  const selectors = [
    '[role="menu"]',
    '[role="listbox"]',
    '.gb_Da', // Common Google dropdown class
    '.VfPpkd-xl07Ob', // Material Design menu class
    '[data-menu-container]',
    '[aria-label*="menu"]',
    '.gb_ca', // Google apps menu
    '.gb_Kc' // Another Google menu class
  ];
  
  for (const selector of selectors) {
    const dropdown = document.querySelector(selector);
    if (dropdown && isVisibleDropdown(dropdown)) {
      console.log(`Found dropdown with selector: ${selector}`);
      return dropdown;
    }
  }
  
  // Fallback: look for recently added visible elements that might be dropdowns
  const recentElements = document.querySelectorAll('[style*="position"], [class*="menu"], [class*="dropdown"]');
  for (const element of recentElements) {
    if (isVisibleDropdown(element) && hasDropdownContent(element)) {
      console.log('Found dropdown via fallback detection');
      return element;
    }
  }
  
  return null;
}

// Find dropdown container in a specific node
function findDropdownContainer(node) {
  if (isVisibleDropdown(node) && hasDropdownContent(node)) {
    return node;
  }
  
  // Check child elements
  const menuElements = node.querySelectorAll('[role="menu"], [role="listbox"], .gb_Da, .VfPpkd-xl07Ob');
  for (const menu of menuElements) {
    if (isVisibleDropdown(menu)) {
      return menu;
    }
  }
  
  return null;
}

// Check if element is a visible dropdown
function isVisibleDropdown(element) {
  if (!element || !element.getBoundingClientRect) return false;
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 && 
    rect.height > 0 && 
    style.display !== 'none' && 
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

// Check if element has dropdown-like content
function hasDropdownContent(element) {
  // Look for typical dropdown content patterns
  const hasMenuItems = element.querySelector('[role="menuitem"], [role="option"], button, a');
  const hasText = element.textContent && element.textContent.trim().length > 0;
  const hasDropdownClasses = element.className && (
    element.className.includes('menu') ||
    element.className.includes('dropdown') ||
    element.className.includes('gb_') // Google classes
  );
  
  return hasMenuItems || (hasText && hasDropdownClasses);
}

// Inject Quick Event option into dropdown
function injectQuickEventOption(dropdown) {
  // Prevent multiple injections
  if (dropdown.querySelector('.quick-event-menu-item')) {
    console.log('Quick Event option already exists in dropdown');
    return;
  }
  
  console.log('Injecting Quick Event option into dropdown');
  
  // Find existing menu items to copy styling
  const existingItems = dropdown.querySelectorAll('[role="menuitem"], [role="option"], button, a');
  let templateItem = null;
  
  for (const item of existingItems) {
    const text = item.textContent?.toLowerCase() || '';
    if (text.includes('event') || text.includes('create') || text.includes('task')) {
      templateItem = item;
      break;
    }
  }
  
  // If no template found, use the first menu item
  if (!templateItem && existingItems.length > 0) {
    templateItem = existingItems[0];
  }
  
  if (!templateItem) {
    console.log('No template item found, creating Quick Event with basic styling');
    createBasicQuickEventItem(dropdown);
    return;
  }
  
  // Clone the template item
  const quickEventItem = templateItem.cloneNode(true);
  quickEventItem.className = templateItem.className + ' quick-event-menu-item';
  quickEventItem.setAttribute('data-quick-event-item', 'true');
  
  // Update the content
  updateQuickEventItemContent(quickEventItem);
  
  // Add click handler
  quickEventItem.addEventListener('click', handleQuickEventClick);
  
  // Insert at the top of the dropdown
  if (dropdown.firstChild) {
    dropdown.insertBefore(quickEventItem, dropdown.firstChild);
  } else {
    dropdown.appendChild(quickEventItem);
  }
  
  console.log('Quick Event option injected successfully');
}

// Update Quick Event item content
function updateQuickEventItemContent(item) {
  // Find text content and update it
  const textElements = item.querySelectorAll('*');
  let updated = false;
  
  for (const element of textElements) {
    if (element.children.length === 0 && element.textContent?.trim()) {
      element.textContent = 'Quick Event';
      updated = true;
      break;
    }
  }
  
  if (!updated) {
    item.textContent = 'Quick Event';
  }
  
  // Find and update icon if present
  const iconElements = item.querySelectorAll('svg, img, [class*="icon"]');
  if (iconElements.length > 0) {
    const icon = iconElements[0];
    if (icon.tagName === 'svg') {
      // Replace with lightning bolt SVG
      icon.innerHTML = `
        <path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor"/>
      `;
      icon.setAttribute('viewBox', '0 0 24 24');
    }
  }
}

// Create basic Quick Event item if no template available
function createBasicQuickEventItem(dropdown) {
  const quickEventItem = document.createElement('div');
  quickEventItem.className = 'quick-event-menu-item';
  quickEventItem.setAttribute('data-quick-event-item', 'true');
  quickEventItem.setAttribute('role', 'menuitem');
  quickEventItem.style.cssText = `
    display: flex !important;
    align-items: center !important;
    padding: 8px 16px !important;
    cursor: pointer !important;
    font-size: 14px !important;
    color: #3c4043 !important;
    font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
    border-radius: 4px !important;
    margin: 2px !important;
    transition: background-color 0.1s ease !important;
  `;
  
  // Add hover effect
  quickEventItem.addEventListener('mouseenter', () => {
    quickEventItem.style.backgroundColor = '#f8f9fa';
  });
  
  quickEventItem.addEventListener('mouseleave', () => {
    quickEventItem.style.backgroundColor = 'transparent';
  });
  
  // Add content
  quickEventItem.innerHTML = `
    <span style="margin-right: 12px; font-size: 16px;">⚡</span>
    <span>Quick Event</span>
  `;
  
  // Add click handler
  quickEventItem.addEventListener('click', handleQuickEventClick);
  
  // Insert at the top
  if (dropdown.firstChild) {
    dropdown.insertBefore(quickEventItem, dropdown.firstChild);
  } else {
    dropdown.appendChild(quickEventItem);
  }
}

// Handle Quick Event click
function handleQuickEventClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('Quick Event clicked!');
  
  // Close the dropdown
  const dropdown = event.target.closest('[role="menu"], [role="listbox"], .gb_Da, .VfPpkd-xl07Ob');
  if (dropdown) {
    dropdown.style.display = 'none';
  }
  
  // TODO: Show inline text input (Task 4)
  alert('Quick Event clicked! (Text input will be implemented in Task 4)');
}
// Initialize the extension
async function init() {
  try {
    console.log('Initializing Google Calendar Natural Language Input...');
    const createButton = await waitForCalendarLoad();
    console.log('Google Calendar loaded successfully, create button found');
    
    // Create the Quick Add button next to the create button
    const quickAddButton = setupQuickAddButton(createButton);
    
    if (!quickAddButton) {
      console.error('Failed to create Quick Add button');
      return;
    }
    
    // Set up mutation observer to maintain Quick Add button
    const observer = setupMutationObserver(createButton, quickAddButton);
    
    // Aggressively maintain Quick Add button
    let currentCreateButton = createButton;
    let currentQuickAddButton = quickAddButton;
    
    const maintainButton = () => {
      // Check if create button still exists
      if (!currentCreateButton || !currentCreateButton.isConnected) {
        console.log('Create button lost, searching for new one...');
        waitForCalendarLoad().then((newButton) => {
          if (newButton && newButton !== currentCreateButton) {
            console.log('Found new create button');
            currentCreateButton = newButton;
            currentQuickAddButton = setupQuickAddButton(currentCreateButton);
            setupMutationObserver(currentCreateButton, currentQuickAddButton);
          }
        }).catch(() => {
          console.log('Could not find create button');
        });
        return;
      }
      
      // Check if Quick Add button still exists and is connected
      const existingQuickAdd = document.querySelector('.quick-add-button');
      if (!existingQuickAdd || !existingQuickAdd.isConnected) {
        console.log('Quick Add button missing, recreating...');
        currentQuickAddButton = setupQuickAddButton(currentCreateButton);
      }
    };
    
    // Check every 2 seconds
    setInterval(maintainButton, 2000);
    
    console.log('Extension initialized successfully with Quick Add button');
    
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

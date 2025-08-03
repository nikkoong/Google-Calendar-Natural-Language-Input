// Global flag to prevent multiple initializations
let isExtensionInitialized = false;
let initializationPromise = null;

// Wait for Google Calendar to fully load
function waitForCalendarLoad() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // Try for 30 seconds
    
    // Check if we're on the calendar page and if the create button exists
    const checkForCreateButton = () => {
      attempts++;
      
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
          break;
        }
      }
      
      // If no button found with selectors, look for buttons containing "Create" text
      if (!createButton) {
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const text = button.textContent?.toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          const title = button.getAttribute('title')?.toLowerCase() || '';
          
          if (text.includes('create') || ariaLabel.includes('create') || title.includes('create')) {
            createButton = button;
            break;
          }
        }
      }
      
      if (createButton) {
        resolve(createButton);
      } else {
        
        if (attempts >= maxAttempts) {
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
  
  // Always remove ALL existing Quick Add buttons first - no exceptions
  const existingButtons = document.querySelectorAll('.quick-add-button');
  existingButtons.forEach(btn => {
    try {
      btn.remove();
    } catch (e) {
      // Button already removed, ignore
    }
  });
  
  // Verify they're really gone
  const remainingButtons = document.querySelectorAll('.quick-add-button');
  if (remainingButtons.length > 0) {
    remainingButtons.forEach(btn => {
      try {
        btn.parentElement?.removeChild(btn);
      } catch (e) {
        // Ignore
      }
    });
  }
  
  // Create the Quick Add button
  const quickAddButton = document.createElement('button');
  quickAddButton.className = 'quick-add-button';
  quickAddButton.setAttribute('data-quick-add-active', 'true');
  quickAddButton.setAttribute('aria-label', 'Quick Add Event using natural language');
  quickAddButton.title = 'Quick Add Event';
  
  // Style the button to match Google Calendar's create button
  quickAddButton.style.cssText = `
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 8px !important;
    padding: 6px 12px !important;
    background: #4285f4 !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    height: 32px !important;
    min-width: auto !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15) !important;
    position: relative !important;
    z-index: 9999 !important;
    user-select: none !important;
    white-space: nowrap !important;
    text-decoration: none !important;
    vertical-align: middle !important;
    flex-shrink: 0 !important;
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
  
  // Insert the button using the most reliable method
  const insertButton = () => {
    const createButtonContainer = createButton.parentElement;
    
    // Try to position the button below the Create button instead of to the right
    const positionBelowCreate = () => {
      // Find a suitable container that can hold the button below the create button
      const targetContainers = [
        createButton.closest('[role="banner"]'),
        createButton.closest('header'),
        createButton.closest('.gb_tc'),
        createButton.closest('.gb_A'),
        createButton.closest('div[style*="flex"]'),
        createButtonContainer?.parentElement,
        document.querySelector('[role="banner"]')
      ];
      
      for (const container of targetContainers) {
        if (container) {
          try {
            
            // Create a wrapper div that positions the button below the create button
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
              display: block !important;
              width: 100% !important;
              margin-top: 8px !important;
              margin-bottom: 4px !important;
            `;
            
            // Style the quick add button for below positioning
            quickAddButton.style.cssText = `
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              margin: 0 !important;
              padding: 4px 12px !important;
              background: #4285f4 !important;
              color: white !important;
              border: none !important;
              border-radius: 4px !important;
              cursor: pointer !important;
              font-family: 'Google Sans', Roboto, Arial, sans-serif !important;
              font-size: 14px !important;
              font-weight: 500 !important;
              height: 26px !important;
              min-width: auto !important;
              transition: all 0.2s ease !important;
              box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15) !important;
              position: relative !important;
              z-index: 9999 !important;
              user-select: none !important;
              white-space: nowrap !important;
              text-decoration: none !important;
              vertical-align: middle !important;
              flex-shrink: 0 !important;
            `;
            
            wrapper.appendChild(quickAddButton);
            
            // Insert the wrapper after the create button's container
            if (createButtonContainer && createButtonContainer.parentElement === container) {
              container.insertBefore(wrapper, createButtonContainer.nextSibling);
              return true;
            } else if (container.contains(createButton)) {
              container.appendChild(wrapper);
              return true;
            }
          } catch (e) {
            // Continue to next container
          }
        }
      }
      return false;
    };
    
    // First try to position below the create button
    if (positionBelowCreate()) {
      return true;
    }
    
    // Fallback to original side-by-side positioning if below positioning fails
    
    // Check if parent has display: contents which can cause issues
    if (createButtonContainer) {
      const parentStyle = window.getComputedStyle(createButtonContainer);
      
      if (parentStyle.display === 'contents') {
        
        // Look for a stable parent container
        const stableContainers = [
          createButton.closest('[role="banner"]'),
          createButton.closest('header'),
          createButton.closest('.gb_tc'),
          createButton.closest('.gb_A'),
          createButton.closest('div[style*="flex"]'),
          createButton.parentElement?.parentElement,
          document.querySelector('[role="banner"]')
        ];
        
        for (const container of stableContainers) {
          if (container && container !== createButtonContainer) {
            try {
              const containerStyle = window.getComputedStyle(container);
              
              if (containerStyle.display !== 'contents' && containerStyle.display !== 'none') {
                // Create a wrapper div to ensure proper positioning
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                  display: inline-flex !important;
                  align-items: center !important;
                  margin-left: 8px !important;
                `;
                wrapper.appendChild(quickAddButton);
                
                container.appendChild(wrapper);
                return true;
              }
            } catch (e) {
              // Continue to next container
            }
          }
        }
      }
    }
    
    if (createButtonContainer && createButton.isConnected) {
      try {
        if (createButton.nextSibling) {
          createButtonContainer.insertBefore(quickAddButton, createButton.nextSibling);
        } else {
          createButtonContainer.appendChild(quickAddButton);
        }
        
        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  };
  
  if (insertButton()) {
    return quickAddButton;
  } else {
    return null;
  }
}

// Handle Quick Add button click
function handleQuickAddClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
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
      <span class="quick-event-shortcut">Trigger with (⌘+E)</span>
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

        <div class="quick-event-help-section">
          <h4>Tips:</h4>
            <ul>
                <li>If the extension doesn't work for you, go to chrome://extensions/shortcuts to see what other extensions are using the (Command/Control+E) shortcut, and change them to something else.</li>
            </ul>
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
    
    // Split by semicolons to handle multiple events
    const events = eventText.split(';').map(e => e.trim()).filter(Boolean);
    
    if (events.length === 0) {
      throw new Error('No valid events found');
    }
    
    const eventUrls = [];
    
    // Generate URLs for each event
    for (const singleEventText of events) {
      try {
        const urls = window.GoogleCalendarNLP.createEventUrls(singleEventText);
        if (urls && urls.length > 0) {
          eventUrls.push(...urls);
        }
      } catch (error) {
        // Continue processing other events even if one fails
        console.warn(`Failed to process event: "${singleEventText}"`, error);
      }
    }
    
    if (eventUrls.length === 0) {
      throw new Error('Could not generate any events from the provided text');
    }
    
    // Navigate to the first event URL (primary behavior)
    window.location.href = eventUrls[0];
    
    // If there are multiple events, open additional tabs (optional enhancement)
    if (eventUrls.length > 1) {
      for (let i = 1; i < eventUrls.length; i++) {
        window.open(eventUrls[i], '_blank');
      }
    }
    
    // Hide input after short delay
    setTimeout(() => {
      hideQuickEventInput();
    }, 500);
    
  } catch (error) {
    
    // Hide loading and show error
    if (loading) loading.classList.remove('show');
    if (actions) actions.style.display = 'flex';
    
    // Show error message
    const errorMessages = [
      `Error creating event${eventText.includes(';') ? 's' : ''}: ${error.message}`,
      '',
      'Please try a different format, like:',
      '"Meeting tomorrow 2pm"',
      '"Lunch Friday 1pm to 2pm"'
    ];
    
    if (eventText.includes(';')) {
      errorMessages.push('"Meeting 2pm; Lunch 5pm" (multiple events)');
    }
    
    alert(errorMessages.join('\n'));
  }
}

// Simple button maintenance - ensures exactly one button exists
function maintainSingleButton(createButton) {
  let lastKnownCreateButton = createButton;
  
  const checkAndMaintain = () => {
    if (!isExtensionInitialized) {
      return;
    }
    
    // If original create button is gone, try to find a new one
    if (!lastKnownCreateButton || !lastKnownCreateButton.isConnected) {
      
      // Use the same comprehensive search logic as waitForCalendarLoad
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
      
      let newCreateButton = null;
      
      // First try selector-based search
      for (const selector of selectors) {
        newCreateButton = document.querySelector(selector);
        if (newCreateButton) {
          lastKnownCreateButton = newCreateButton;
          break;
        }
      }
      
      // If no button found with selectors, look for buttons containing "Create" text
      if (!newCreateButton) {
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const text = button.textContent?.toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          const title = button.getAttribute('title')?.toLowerCase() || '';
          
          if (text.includes('create') || ariaLabel.includes('create') || title.includes('create')) {
            newCreateButton = button;
            lastKnownCreateButton = newCreateButton;
            break;
          }
        }
      }
      
      // If still no button found, try finding any button in header/banner areas
      if (!newCreateButton) {
        const headerAreas = [
          document.querySelector('[role="banner"]'),
          document.querySelector('header'),
          document.querySelector('.gb_tc'),
          document.querySelector('.gb_A'),
          document.querySelector('[data-test-id*="header"]')
        ];
        
        for (const area of headerAreas) {
          if (area) {
            const buttons = area.querySelectorAll('button');
            if (buttons.length > 0) {
              // Take the first button we find in header areas as a fallback
              newCreateButton = buttons[0];
              lastKnownCreateButton = newCreateButton;
              break;
            }
          }
        }
      }
      
      if (!newCreateButton) {
        return;
      }
    }
    
    const existingButtons = document.querySelectorAll('.quick-add-button');
    const connectedButtons = Array.from(existingButtons).filter(btn => btn.isConnected);
    
    if (connectedButtons.length === 0) {
      // No button exists, create one
      setupQuickAddButton(lastKnownCreateButton);
    } else if (connectedButtons.length > 1) {
      // Multiple buttons exist, keep only the first one
      for (let i = 1; i < connectedButtons.length; i++) {
        try {
          connectedButtons[i].remove();
        } catch (e) {
          // Ignore removal errors
        }
      }
    } else {
      // Exactly 1 button exists - check if it's actually visible
      const button = connectedButtons[0];
      const rect = button.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      if (!isVisible) {
        button.remove();
        setupQuickAddButton(lastKnownCreateButton);
      }
    }
  };
  
  // Check every 5 seconds to maintain exactly one button (reduced frequency)
  const maintenanceInterval = setInterval(checkAndMaintain, 5000);
  
  // Also check when the page is idle (no recent mutations)
  let mutationTimer = null;
  let consecutiveFailures = 0;
  const observer = new MutationObserver(() => {
    // Reset the timer on any mutation
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      checkAndMaintain();
      
      // If we keep failing to find buttons, reduce check frequency
      const currentButtons = document.querySelectorAll('.quick-add-button');
      if (currentButtons.length === 0) {
        consecutiveFailures++;
        if (consecutiveFailures > 5) {
          clearInterval(maintenanceInterval);
          // Restart with longer interval
          setInterval(checkAndMaintain, 10000);
          consecutiveFailures = 0;
        }
      } else {
        consecutiveFailures = 0; // Reset on success
      }
    }, 1000); // Increased delay to 1 second after mutations stop
  });
  
  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return {
    interval: maintenanceInterval,
    observer: observer
  };
}

// Initialize the extension
async function init() {
  // Prevent multiple initializations
  if (isExtensionInitialized) {
    return;
  }
  
  // If there's already an initialization in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Mark as initializing and create promise
  initializationPromise = (async () => {
    try {
      
      // Clean up any existing Quick Add buttons first
      const existingButtons = document.querySelectorAll('.quick-add-button');
      existingButtons.forEach(btn => {
        try {
          btn.remove();
        } catch (e) {
          // Ignore removal errors
        }
      });
      
      const createButton = await waitForCalendarLoad();
      
      // Create the Quick Add button next to the create button
      const quickAddButton = setupQuickAddButton(createButton);
      
      if (!quickAddButton) {
        return;
      }
      
      // Set up simple maintenance system to ensure exactly one button
      const maintenance = maintainSingleButton(createButton);
      
      // Mark as successfully initialized
      isExtensionInitialized = true;
      
    } catch (error) {
      // Ignore initialization errors
    } finally {
      // Clear the initialization promise
      initializationPromise = null;
    }
  })();
  
  return initializationPromise;
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Clean up on page unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
  isExtensionInitialized = false;
  initializationPromise = null;
});

// Handle single-page app navigation (like Google Calendar)
let currentUrl = window.location.href;
const urlCheckInterval = setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    isExtensionInitialized = false;
    initializationPromise = null;
    
    // Small delay to let the new page load
    setTimeout(() => {
      init();
    }, 1000);
  }
}, 1000);

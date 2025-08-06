import {createEventUrls} from './helpers.js'

// UI Elements
const input = document.getElementById('quick-event-input');
const createBtn = document.getElementById('quick-event-create');
const helpBtn = document.getElementById('quick-event-help');
const settingsBtn = document.getElementById('quick-event-settings');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// Enable/disable create button based on input
input.addEventListener('input', (e) => {
  const hasText = e.target.value.trim().length > 0;
  createBtn.disabled = !hasText;
  hideError();
});

// Handle Enter key to create events
input.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !createBtn.disabled) {
    e.preventDefault();
    await handleCreateEvents();
  }
});

// Handle create button click
createBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!createBtn.disabled) {
    await handleCreateEvents();
  }
});

// Handle help button click
helpBtn.addEventListener('click', (e) => {
  e.preventDefault();
  showHelp();
});

// Handle settings button click
settingsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  showSettings();
});

// Main event creation function
async function handleCreateEvents() {
  const eventText = sanitizeInput(input.value);
  if (!eventText) return;

  try {
    showLoading();
    hideError();

    // Get user's language preference and saved calendars
    const storage = await chrome.storage.sync.get();
    const lang = storage.lang || 'en';
    const savedCalendars = storage.savedCalendars || {};

    // Split events first, then process each individually
    const events = eventText.split(';').map(e => e.trim()).filter(Boolean);
    const finalUrls = [];

    for (const singleEventText of events) {
      // Process calendar ID substitutions for this specific event
      const { processedText, calendarId } = await processCalendarSubstitutions(singleEventText, savedCalendars);

      // Generate event URLs for this specific event
      const eventUrls = createEventUrls(processedText, lang);

      if (eventUrls && eventUrls.length > 0) {
        // Add calendar ID parameter if specified for this event
        const urlsWithCalendar = eventUrls.map(url => {
          if (calendarId) {
            const urlObj = new URL(url);
            urlObj.searchParams.set('src', calendarId);
            return urlObj.toString();
          }
          return url;
        });
        
        finalUrls.push(...urlsWithCalendar);
      }
    }

    if (finalUrls.length > 0) {
      // Create new tabs for each event
      finalUrls.forEach(url => {
        chrome.tabs.create({ url });
      });

      // Clear input and show success
      input.value = '';
      createBtn.disabled = true;
      
      // Close popup after short delay
      setTimeout(() => {
        window.close();
      }, 500);

    } else {
      throw new Error('Could not generate events from the provided text');
    }

  } catch (error) {
    showError(`${error.message}. Please try a different format, like "Gym tomorrow 2pm"`);
  } finally {
    hideLoading();
  }
}

// Process calendar ID substitutions in event text
async function processCalendarSubstitutions(eventText, savedCalendars) {
  // Look for @nickname patterns in the text (alphanumeric only)
  const calendarPattern = /@([a-zA-Z0-9]+)/g;
  const matches = [...eventText.matchAll(calendarPattern)];
  
  if (matches.length === 0) {
    return { processedText: eventText, calendarId: null };
  }
  
  // Use the first calendar ID found in this specific event
  const firstMatch = matches[0];
  const nickname = '@' + firstMatch[1];
  
  // Check if this nickname exists in saved calendars
  const calendarId = savedCalendars[nickname];
  
  if (!calendarId) {
    throw new Error(`Calendar nickname "${nickname}" not found. Please add it in Settings.`);
  }
  
  // Remove only the @nickname from this specific event text
  const processedText = eventText.replace(new RegExp(`@${firstMatch[1]}\\b`, 'g'), '').trim();
  
  return { processedText, calendarId };
}

// Show loading state
function showLoading() {
  loading.classList.add('show');
  createBtn.disabled = true;
  helpBtn.disabled = true;
}

// Hide loading state
function hideLoading() {
  loading.classList.remove('show');
  const hasText = input.value.trim().length > 0;
  createBtn.disabled = !hasText;
  helpBtn.disabled = false;
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

// Hide error message
function hideError() {
  errorMessage.classList.remove('show');
}

// Show help information
function showHelp() {
  // Hide the main container and show help
  const mainContainer = document.querySelector('.quick-event-popup-container');
  let helpContainer = document.querySelector('.help-container');
  
  if (!helpContainer) {
    helpContainer = createHelpContainer();
    document.body.appendChild(helpContainer);
  }
  
  mainContainer.style.display = 'none';
  helpContainer.style.display = 'block';
}

// Create help container
function createHelpContainer() {
  const container = document.createElement('div');
  container.className = 'help-container';
  
  container.innerHTML = `
    <div class="help-header">
      <h3 class="help-title">Natural Language Event Creation Help</h3>
      <button class="help-back-btn" id="help-back">← Back</button>
    </div>
    
    <div class="help-content">
      <div class="help-section">
        <h4>Basic Examples:</h4>
        <ul>
          <li>"Clean the house tomorrow 2pm"</li>
          <li>"Lunch Friday 1pm to 2pm"</li>
          <li>"Doctor appointment next Monday 10am"</li>
        </ul>
      </div>

      <div class="help-section">
        <h4>Advanced Features:</h4>
        <ul>
          <li><strong>Descriptions:</strong> "Meeting d(discuss project timeline)"</li>
          <li><strong>Locations:</strong> "Dinner l(Applebees)"</li>
          <li><strong>Recurring:</strong> "Team standup every Monday 9am"</li>
          <li><strong>Multiple events:</strong> "Jam session 1pm; Carlos Birthday 5pm every year"</li>
          <li><strong>Calendar targeting:</strong> "Meeting tomorrow 2pm @work"</li>
        </ul>
      </div>

      <div class="help-section">
        <h4>Time Formats:</h4>
        <ul>
          <li>"tomorrow", "next week", "Friday"</li>
          <li>"2pm", "19:40", "2:30pm"</li>
          <li>"10am to 5pm", "9am-10am"</li>
        </ul>
      </div>

      <div class="help-section">
        <h4>Recurrence Patterns:</h4>
        <ul>
          <li>"every day", "every week", "every month"</li>
          <li>"every Monday", "every 2 weeks"</li>
        </ul>
      </div>

      <div class="help-section">
        <h4>Calendar Nicknames:</h4>
        <ul>
          <li>Set up calendar nicknames in Settings (⚙️ button)</li>
          <li>Use @nickname to target specific calendars</li>
          <li>Examples: @work, @personal, @gym</li>
        </ul>
      </div>

      <div class="help-section">
        <h4>Tips:</h4>
        <ul>
          <li>If the extension doesn't work for you, go to chrome://extensions/shortcuts to see what other extensions are using the (Command/Control+E) shortcut, and change them to something else.</li>
        </ul>
      </div>
    </div>
  `;
  
  // Add event listener for back button
  const backBtn = container.querySelector('#help-back');
  backBtn.addEventListener('click', () => {
    hideHelp();
  });
  
  return container;
}

// Hide help and show main container
function hideHelp() {
  const mainContainer = document.querySelector('.quick-event-popup-container');
  const helpContainer = document.querySelector('.help-container');
  
  if (helpContainer) {
    helpContainer.style.display = 'none';
  }
  mainContainer.style.display = 'flex';
}

// Show settings dialog
async function showSettings() {
  // Hide the main container and show settings
  const mainContainer = document.querySelector('.quick-event-popup-container');
  let settingsContainer = document.querySelector('.settings-container');
  
  if (!settingsContainer) {
    settingsContainer = createSettingsContainer();
    document.body.appendChild(settingsContainer);
  }
  
  mainContainer.style.display = 'none';
  settingsContainer.style.display = 'block';
  
  // Load and display saved calendars
  await loadSavedCalendars();
}

// Create settings container
function createSettingsContainer() {
  const container = document.createElement('div');
  container.className = 'settings-container';
  
  container.innerHTML = `
    <div class="settings-header">
      <h3 class="settings-title">Calendar Settings</h3>
      <button class="settings-back-btn" id="settings-back">← Back</button>
    </div>
    
    <div class="calendar-table-container">
      <table class="calendar-table">
        <thead>
          <tr>
            <th>Nickname</th>
            <th>Calendar ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="calendar-table-body">
          <tr class="add-row">
            <td>
              <input type="text" class="nickname-input" placeholder="@nickname" maxlength="50" id="new-nickname">
            </td>
            <td>
              <input type="text" class="calendar-id-input" placeholder="calendar@example.com" maxlength="180" id="new-calendar-id">
            </td>
            <td>
              <button class="save-btn" id="save-calendar">Save</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  
  // Add event listeners
  setupSettingsListeners(container);
  
  return container;
}

// Setup settings event listeners
function setupSettingsListeners(container) {
  const backBtn = container.querySelector('#settings-back');
  const saveBtn = container.querySelector('#save-calendar');
  const nicknameInput = container.querySelector('#new-nickname');
  const calendarIdInput = container.querySelector('#new-calendar-id');
  
  // Back button
  backBtn.addEventListener('click', () => {
    hideSettings();
  });
  
  // Save button
  saveBtn.addEventListener('click', async () => {
    await saveNewCalendar();
  });
  
  // Auto-format nickname with @ symbol and validate characters
  nicknameInput.addEventListener('input', (e) => {
    let value = e.target.value;
    
    // Ensure it starts with @
    if (value && !value.startsWith('@')) {
      value = '@' + value;
    }
    
    // Remove invalid characters (keep only alphanumeric after @)
    if (value.length > 1) {
      const afterAt = value.substring(1);
      const cleanAfterAt = afterAt.replace(/[^a-zA-Z0-9]/g, '');
      value = '@' + cleanAfterAt;
    }
    
    e.target.value = value;
  });
  
  // Enter key to save
  calendarIdInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveNewCalendar();
    }
  });
}

// Load saved calendars from storage
async function loadSavedCalendars() {
  try {
    const storage = await chrome.storage.sync.get('savedCalendars');
    const savedCalendars = storage.savedCalendars || {};
    
    displayCalendars(savedCalendars);
  } catch (error) {
    console.error('Error loading saved calendars:', error);
    // Show user-friendly error message
    alert('Error loading saved calendars. The settings may not display correctly.');
    // Still try to display empty calendars as fallback
    displayCalendars({});
  }
}

// Display calendars in the table
function displayCalendars(calendars) {
  const tbody = document.querySelector('#calendar-table-body');
  const addRow = tbody.querySelector('.add-row');
  
  // Clear existing rows (except add row)
  const existingRows = tbody.querySelectorAll('tr:not(.add-row)');
  existingRows.forEach(row => row.remove());
  
  // Add calendar rows
  Object.entries(calendars).forEach(([nickname, calendarId]) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="nickname-cell">${sanitizeInput(nickname)}</td>
      <td class="calendar-id-cell" title="${sanitizeInput(calendarId)}">${truncateCalendarId(sanitizeInput(calendarId))}</td>
      <td>
        <button class="remove-btn" data-nickname="${sanitizeInput(nickname)}">Remove</button>
      </td>
    `;
    
    // Add remove functionality
    const removeBtn = row.querySelector('.remove-btn');
    removeBtn.addEventListener('click', async () => {
      await removeCalendar(nickname);
    });
    
    tbody.insertBefore(row, addRow);
  });
}

// Truncate calendar ID for display
function truncateCalendarId(calendarId) {
  if (calendarId.length <= 30) {
    return calendarId;
  }
  return calendarId.substring(0, 30) + '...';
}

// Sanitize user input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Save new calendar
async function saveNewCalendar() {
  const nicknameInput = document.querySelector('#new-nickname');
  const calendarIdInput = document.querySelector('#new-calendar-id');
  
  let nickname = sanitizeInput(nicknameInput.value);
  const calendarId = sanitizeInput(calendarIdInput.value);
  
  if (!nickname || !calendarId) {
    alert('Please enter both nickname and calendar ID');
    return;
  }
  
  // Ensure nickname starts with @
  if (!nickname.startsWith('@')) {
    nickname = '@' + nickname;
  }
  
  // Validate nickname format (only alphanumeric characters after @)
  const nicknamePattern = /^@[a-zA-Z0-9]+$/;
  if (!nicknamePattern.test(nickname)) {
    alert('Invalid nickname format. Nicknames must start with @ and contain only alphanumeric characters (letters and numbers). No spaces, hyphens, or special characters allowed.\n\nExample: @work, @personal, @gym123');
    return;
  }
  
  // Validate calendar ID format (comprehensive email validation)
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailPattern.test(calendarId)) {
    alert('Invalid calendar ID format. Calendar IDs must be valid email addresses.\n\nExamples:\n• your-calendar@gmail.com\n• calendar+work@example.com\n• calendar123@domain.co.uk\n• work.calendar@company.org');
    return;
  }
  
  // Additional validation for calendar ID length (Google Calendar limits)
  if (calendarId.length > 254) {
    alert('Calendar ID is too long. Please use a shorter email address (maximum 254 characters).');
    return;
  }
  
  try {
    // Get existing calendars
    const storage = await chrome.storage.sync.get('savedCalendars');
    const savedCalendars = storage.savedCalendars || {};
    
    // Check for duplicate nickname and confirm overwrite
    if (savedCalendars[nickname]) {
      const confirmOverwrite = confirm(`The nickname "${nickname}" already exists with calendar ID:\n${savedCalendars[nickname]}\n\nDo you want to overwrite it with the new calendar ID:\n${calendarId}?`);
      if (!confirmOverwrite) {
        return;
      }
    }
    
    // Add new calendar
    savedCalendars[nickname] = calendarId;
    
    // Save to storage
    await chrome.storage.sync.set({ savedCalendars });
    
    // Clear inputs
    nicknameInput.value = '';
    calendarIdInput.value = '';
    
    // Reload display
    await loadSavedCalendars();
    
  } catch (error) {
    console.error('Error saving calendar:', error);
    let errorMessage = 'Error saving calendar. ';
    
    if (error.message && error.message.includes('QUOTA_BYTES_PER_ITEM quota exceeded')) {
      errorMessage += 'Storage quota exceeded. Please remove some calendars before adding new ones.';
    } else if (error.message && error.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded')) {
      errorMessage += 'Too many operations. Please wait a moment before trying again.';
    } else {
      errorMessage += 'Please try again.';
    }
    
    alert(errorMessage);
  }
}

// Remove calendar
async function removeCalendar(nickname) {
  try {
    const storage = await chrome.storage.sync.get('savedCalendars');
    const savedCalendars = storage.savedCalendars || {};
    
    delete savedCalendars[nickname];
    
    await chrome.storage.sync.set({ savedCalendars });
    
    // Reload display
    await loadSavedCalendars();
    
  } catch (error) {
    console.error('Error removing calendar:', error);
    let errorMessage = 'Error removing calendar. ';
    
    if (error.message && error.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded')) {
      errorMessage += 'Too many operations. Please wait a moment before trying again.';
    } else {
      errorMessage += 'Please try again.';
    }
    
    alert(errorMessage);
  }
}

// Hide settings and show main container
function hideSettings() {
  const mainContainer = document.querySelector('.quick-event-popup-container');
  const settingsContainer = document.querySelector('.settings-container');
  
  if (settingsContainer) {
    settingsContainer.style.display = 'none';
  }
  mainContainer.style.display = 'flex';
}

// Auto-focus input when popup opens
document.addEventListener('DOMContentLoaded', () => {
  input.focus();
});

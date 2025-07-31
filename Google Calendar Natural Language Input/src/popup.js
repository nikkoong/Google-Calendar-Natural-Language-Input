import {createEventUrls} from './helpers.js'

// UI Elements
const input = document.getElementById('quick-event-input');
const createBtn = document.getElementById('quick-event-create');
const helpBtn = document.getElementById('quick-event-help');
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

// Main event creation function
async function handleCreateEvents() {
  const eventText = input.value.trim();
  if (!eventText) return;

  try {
    showLoading();
    hideError();

    console.log('Processing event text:', eventText);

    // Get user's language preference
    const storage = await chrome.storage.sync.get();
    const lang = storage.lang || 'en';

    // Generate event URLs using the same helper function
    const eventUrls = createEventUrls(eventText, lang);

    if (eventUrls && eventUrls.length > 0) {
      console.log('Generated event URLs:', eventUrls);

      // Create new tabs for each event
      eventUrls.forEach(url => {
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
    console.error('Error creating events:', error);
    showError(`${error.message}. Please try a different format, like "Gym tomorrow 2pm"`);
  } finally {
    hideLoading();
  }
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
  alert(`Natural Language Event Creation Help

Basic Examples:
• "Clean the house tomorrow 2pm"
• "Lunch Friday 1pm to 2pm"
• "Doctor appointment next Monday 10am"

Advanced Features:
• Descriptions: "Meeting d(discuss project timeline)"
• Locations: "Dinner l(Applebees)"
• Recurring: "Team standup every Monday 9am"
• Multiple events: "Jam session 1pm; Carlos Birthday 5pm every year"

Time Formats:
• "tomorrow", "next week", "Friday"
• "2pm", "19:40", "2:30pm"
• "10am to 5pm", "9am-10am"

Recurrence Patterns:
• "every day", "every week", "every month"
• "every Monday", "every 2 weeks"

Tips:
• If the extension doesn't work for you, go to chrome://extensions/shortcuts to see what other extensions are using the (Command/Control+E) shortcut, and change them to something else.
`);
}

// Auto-focus input when popup opens
document.addEventListener('DOMContentLoaded', () => {
  input.focus();
});

var SharedUtils = (function (exports) {
  'use strict';

  // Shared utilities for both popup and content script

  // Calendar ID validation
  const CALENDAR_VALIDATION = {
    // Comprehensive email validation pattern
    emailPattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    
    // Nickname validation pattern (alphanumeric after @)
    nicknamePattern: /^@[a-zA-Z0-9]+$/,
    
    // Maximum calendar ID length (Google Calendar limits)
    maxCalendarIdLength: 254,
    
    // Validation messages
    messages: {
      invalidEmail: 'Invalid calendar ID format. Calendar IDs must be valid email addresses.\n\nExamples:\n• your-calendar@gmail.com\n• calendar+work@example.com\n• calendar123@domain.co.uk\n• work.calendar@company.org',
      invalidNickname: 'Invalid nickname format. Nicknames must start with @ and contain only alphanumeric characters (letters and numbers). No spaces, hyphens, or special characters allowed.\n\nExample: @work, @personal, @gym123',
      tooLong: 'Calendar ID is too long. Please use a shorter email address (maximum 254 characters).',
      missingFields: 'Please enter both nickname and calendar ID'
    }
  };

  // Truncate calendar ID for display
  function truncateCalendarId(calendarId) {
    if (calendarId.length <= 30) {
      return calendarId;
    }
    return calendarId.substring(0, 30) + '...';
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

  // Chrome storage operations with error handling
  const ChromeStorage = {
    // Get saved calendars with error handling
    async getSavedCalendars() {
      try {
        const storage = await chrome.storage.sync.get('savedCalendars');
        return storage.savedCalendars || {};
      } catch (error) {
        console.error('Error loading saved calendars:', error);
        throw new Error('Error loading saved calendars. The settings may not display correctly.');
      }
    },

    // Save calendars with error handling
    async setSavedCalendars(savedCalendars) {
      try {
        await chrome.storage.sync.set({ savedCalendars });
      } catch (error) {
        console.error('Error saving calendars:', error);
        let errorMessage = 'Error saving calendar. ';
        
        if (error.message && error.message.includes('QUOTA_BYTES_PER_ITEM quota exceeded')) {
          errorMessage += 'Storage quota exceeded. Please remove some calendars before adding new ones.';
        } else if (error.message && error.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded')) {
          errorMessage += 'Too many operations. Please wait a moment before trying again.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        throw new Error(errorMessage);
      }
    },

    // Remove a calendar by nickname
    async removeCalendar(nickname) {
      try {
        const savedCalendars = await this.getSavedCalendars();
        delete savedCalendars[nickname];
        await this.setSavedCalendars(savedCalendars);
      } catch (error) {
        console.error('Error removing calendar:', error);
        let errorMessage = 'Error removing calendar. ';
        
        if (error.message && error.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded')) {
          errorMessage += 'Too many operations. Please wait a moment before trying again.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        throw new Error(errorMessage);
      }
    },

    // Add or update a calendar
    async saveCalendar(nickname, calendarId) {
      try {
        const savedCalendars = await this.getSavedCalendars();
        
        // Check for duplicate and get confirmation if needed
        if (savedCalendars[nickname]) {
          const confirmOverwrite = confirm(`The nickname "${nickname}" already exists with calendar ID:\n${savedCalendars[nickname]}\n\nDo you want to overwrite it with the new calendar ID:\n${calendarId}?`);
          if (!confirmOverwrite) {
            return false; // User cancelled
          }
        }
        
        savedCalendars[nickname] = calendarId;
        await this.setSavedCalendars(savedCalendars);
        return true; // Success
      } catch (error) {
        throw error; // Re-throw to be handled by caller
      }
    },

    // Get Quick Add button visibility preference
    async getQuickAddButtonVisible() {
      try {
        const storage = await chrome.storage.sync.get('quickAddButtonVisible');
        // Default to false (hidden) as requested
        return storage.quickAddButtonVisible ?? false;
      } catch (error) {
        console.error('Error loading Quick Add button preference:', error);
        return false; // Default to hidden on error
      }
    },

    // Set Quick Add button visibility preference
    async setQuickAddButtonVisible(visible) {
      try {
        await chrome.storage.sync.set({ quickAddButtonVisible: visible });
      } catch (error) {
        console.error('Error saving Quick Add button preference:', error);
        throw new Error('Error saving Quick Add button preference. Please try again.');
      }
    }
  };

  // Calendar validation functions
  function validateCalendar(nickname, calendarId) {
    if (!nickname || !calendarId) {
      throw new Error(CALENDAR_VALIDATION.messages.missingFields);
    }
    
    // Ensure nickname starts with @
    if (!nickname.startsWith('@')) {
      nickname = '@' + nickname;
    }
    
    // Validate nickname format
    if (!CALENDAR_VALIDATION.nicknamePattern.test(nickname)) {
      throw new Error(CALENDAR_VALIDATION.messages.invalidNickname);
    }
    
    // Validate calendar ID format
    if (!CALENDAR_VALIDATION.emailPattern.test(calendarId)) {
      throw new Error(CALENDAR_VALIDATION.messages.invalidEmail);
    }
    
    // Validate calendar ID length
    if (calendarId.length > CALENDAR_VALIDATION.maxCalendarIdLength) {
      throw new Error(CALENDAR_VALIDATION.messages.tooLong);
    }
    
    return nickname; // Return the properly formatted nickname
  }

  // Nickname input formatting
  function formatNicknameInput(input) {
    let value = input.value;
    
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
    
    input.value = value;
  }

  exports.CALENDAR_VALIDATION = CALENDAR_VALIDATION;
  exports.ChromeStorage = ChromeStorage;
  exports.formatNicknameInput = formatNicknameInput;
  exports.processCalendarSubstitutions = processCalendarSubstitutions;
  exports.truncateCalendarId = truncateCalendarId;
  exports.validateCalendar = validateCalendar;

  return exports;

})({});

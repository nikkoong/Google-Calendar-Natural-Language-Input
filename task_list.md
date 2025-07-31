# Google Calendar Quick Event Feature - Task List

## Overview
Add a separate "Quick Add" button next to Google Calendar's create button that opens an inline text input for natural language event creation.

---

## ✅ Task 1: Add Content Script Support and Quick Add Button
**Status: COMPLETED**

- [x] Update `manifest.json` with content script permissions and configuration
- [x] Add `"activeTab"` permission for interacting with Google Calendar
- [x] Add `"host_permissions"` for `"https://calendar.google.com/*"`
- [x] Configure `content_scripts` section to inject into Google Calendar pages
- [x] Add `web_accessible_resources` for script and CSS access
- [x] Create basic `content.js` file with Google Calendar page detection
- [x] Create `content.css` file with styling foundation
- [x] Verify content script successfully injects and finds create button
- [x] Create separate "Quick Add" button positioned next to the create button
- [x] Style "Quick Add" button to match Google Calendar's design language
- [x] Implement loop prevention to avoid constant styling reapplication

---

## ✅ Task 2: Implement Quick Add Button Click Handler
**Status: COMPLETED**

- [x] Remove dropdown hijacking approach (caused page loading issues)
- [x] Create standalone "Quick Add" button with proper styling
- [x] Position button to the right of Google Calendar's create button
- [x] Match Google's Material Design styling and colors
- [x] Add hover states and click handling for the Quick Add button
- [x] Include lightning bolt icon and "Quick Add" text
- [x] Ensure button integrates seamlessly with Google Calendar's UI
- [x] Add click event listener that will trigger text input (Task 4)
- [x] Make button responsive and accessible
- [x] Test button positioning across different screen sizes

---

## ✅ Task 3: Create Shared Parsing Module
**Status: COMPLETED**

- [x] Extract core parsing functions from `src/helpers.js`:
  - [x] `parse()` function for natural language processing
  - [x] `createEventUrls()` function for Google Calendar URL generation  
  - [x] `parseRecurrence()` function for handling recurring events
  - [x] `parseDetails()` and `parseLocation()` for `d()` and `l()` syntax
- [x] Create `src/content-helpers.js` with all necessary parsing functions
- [x] Update build system to bundle content-helpers.js with chrono-node and dayjs
- [x] Configure `manifest.json` to include content-helpers.js before content.js
- [x] Export parsing functions via `window.GoogleCalendarNLP` for content script access
- [x] Test that parsing functions work correctly in content script context
- [x] Verify all natural language parsing features work in the Quick Add button
- [x] Add test functionality to Quick Add button click handler

---

## ✅ Task 4: Implement Quick Event UI
**Status: COMPLETED**

- [x] Create inline text input component that appears when "Quick Event" is clicked
- [x] Position input box relative to create button (below and aligned with smart positioning)
- [x] Style input to match Google Calendar's Material Design:
  - [x] Use Google's font family (`'Google Sans', Roboto, Arial, sans-serif`)
  - [x] Match Google's color scheme and border styles (#4285f4 focus, #dadce0 borders)
  - [x] Add proper focus states and shadows with smooth transitions
  - [x] Ensure responsive design for different screen sizes (mobile-friendly)
- [x] Implement show/hide functionality:
  - [x] Show input when "Quick Event" is clicked (smooth fade-in animation)
  - [x] Hide input when clicking outside (click away detection)
  - [x] Hide input when pressing Escape key
  - [x] Toggle visibility when clicking Quick Add button multiple times
- [x] Add keyboard shortcuts:
  - [x] Enter key to submit and create event
  - [x] Escape key to cancel and close
  - [x] Tab navigation support through all interactive elements
- [x] Add comprehensive UI elements:
  - [x] Header with title and close button
  - [x] Placeholder text with example: "e.g., Lunch tomorrow 1pm to 2pm"
  - [x] Help text with additional examples and syntax
  - [x] Action buttons (Cancel/Create Event) with proper states
  - [x] Loading state with spinner for event creation
- [x] Implement auto-focus on input when opened
- [x] Smart positioning to prevent off-screen display
- [x] Input validation and real-time button state management

---

## ⏳ Task 5: Wire Event Creation Logic
**Status: TODO**

- [ ] Connect text input to existing natural language parsing:
  - [ ] Call `parse()` function on input text when Enter is pressed
  - [ ] Handle multiple events separated by semicolons (`;`)
  - [ ] Support `d(description)` syntax for event details
  - [ ] Support `l(location)` syntax for event locations
  - [ ] Process recurrence patterns (every, weekly, daily, etc.)
- [ ] Generate Google Calendar event creation URLs:
  - [ ] Use existing `createEventUrls()` function
  - [ ] Handle single events and multiple events
  - [ ] Ensure proper URL encoding for titles, descriptions, locations
- [ ] Implement navigation to event creation:
  - [ ] Navigate to generated Google Calendar URLs
  - [ ] Handle multiple events by opening multiple tabs or sequential navigation
  - [ ] Provide user feedback during event creation process
- [ ] Add loading states and user feedback:
  - [ ] Show processing indicator while parsing
  - [ ] Display success message when events are created
  - [ ] Clear input field after successful creation

---

## ⏳ Task 6: Add Error Handling and UX Polish
**Status: TODO**

- [ ] Implement robust error handling:
  - [ ] Catch and display parsing errors for invalid natural language input
  - [ ] Handle network errors gracefully
  - [ ] Provide helpful error messages for common input mistakes
  - [ ] Add fallback behavior if Google Calendar UI changes
- [ ] Add user experience enhancements:
  - [ ] Show helpful tips or examples for natural language input
  - [ ] Add success animations or feedback when events are created
  - [ ] Implement input validation with real-time feedback
  - [ ] Add keyboard shortcuts help tooltip
- [ ] Performance optimizations:
  - [ ] Debounce input processing to avoid excessive parsing
  - [ ] Optimize DOM queries and event listeners
  - [ ] Minimize impact on Google Calendar's performance
- [ ] Accessibility improvements:
  - [ ] Add proper ARIA labels and descriptions
  - [ ] Ensure keyboard navigation works correctly
  - [ ] Support screen readers and assistive technologies
  - [ ] Test with high contrast and accessibility tools

---

## ⏳ Task 7: Testing and Refinement
**Status: TODO**

- [ ] Cross-browser compatibility testing:
  - [ ] Test in Chrome (primary target)
  - [ ] Test in Edge (Chromium-based)
  - [ ] Verify extension works with different Chrome versions
- [ ] Google Calendar interface compatibility:
  - [ ] Test with different Google Calendar themes (light/dark mode)
  - [ ] Verify functionality works across different calendar views (month, week, day)
  - [ ] Test with different Google Calendar interface languages
  - [ ] Handle Google Calendar UI updates and changes gracefully
- [ ] Natural language parsing edge cases:
  - [ ] Test with various date formats and edge cases
  - [ ] Verify timezone handling works correctly
  - [ ] Test recurring event patterns thoroughly
  - [ ] Validate `d()` and `l()` syntax handling
- [ ] Performance and reliability testing:
  - [ ] Test with slow internet connections
  - [ ] Verify extension doesn't slow down Google Calendar
  - [ ] Test extension reload and error recovery
  - [ ] Monitor for memory leaks or performance issues
- [ ] User acceptance testing:
  - [ ] Gather feedback on UI/UX design
  - [ ] Test with real-world natural language inputs
  - [ ] Validate that the feature feels native to Google Calendar
  - [ ] Ensure the feature is discoverable and intuitive

---

## Success Criteria

- [ ] "Quick Event" appears seamlessly in Google Calendar's native create dropdown
- [ ] Text input appears inline and matches Google's design language
- [ ] All existing natural language parsing features work in the new UI
- [ ] Multiple events can be created using semicolon separation
- [ ] Extension is performant and doesn't interfere with Google Calendar
- [ ] Feature feels native and integrated with Google Calendar's interface
- [ ] Extension gracefully handles Google Calendar UI changes and updates

---

## Development Notes

- **Primary Technology Stack**: Chrome Extension (Manifest V3), Vanilla JavaScript, Chrono.js for natural language parsing
- **Build System**: Rollup.js for bundling, npm for package management
- **Target Browser**: Chrome (with potential Edge compatibility)
- **Integration Approach**: Content script injection into `calendar.google.com`

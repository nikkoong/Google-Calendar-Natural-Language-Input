# Calendar Selection Research for Google Calendar Natural Language Extension

## Overview
This document researches how to implement calendar selection functionality in the Quick Add Event extension, allowing users to specify which calendar their natural language events should be added to.

---

## Current State Analysis

### Current Implementation
- Extension currently creates events using Google Calendar's URL template system
- Events are added to the user's **default calendar** (typically "primary")
- No calendar selection mechanism exists in the current UI
- Uses URL pattern: `https://www.google.com/calendar/event?action=TEMPLATE&text=...&dates=...`

### Default Behavior
- Google Calendar adds events to the user's primary calendar when using URL templates
- No `src` parameter is currently included in generated URLs
- Users must manually move events between calendars after creation

---

## Technical Approaches

### 1. URL Parameter Method (Recommended)

#### Implementation Details
- **Parameter**: `src` (source calendar)
- **Format**: `src=calendar_email_or_id`
- **Example**: `src=work%40company.com` or `src=personal.calendar%40gmail.com`

#### URL Structure
```
https://www.google.com/calendar/event?
action=TEMPLATE&
text=Meeting&
dates=20240101T100000/20240101T110000&
src=work%40company.com&
location=Office&
details=Weekly%20meeting
```

#### Advantages
✅ Simple to implement - just add parameter to existing URL generation
✅ Works with current extension architecture
✅ No additional permissions required
✅ Consistent with Google Calendar's URL API
✅ Backwards compatible

#### Limitations
❌ Requires knowing calendar IDs/emails in advance
❌ No native UI for calendar discovery
❌ User must manually specify calendar names/IDs

### 2. DOM Inspection Method

#### Implementation Details
- Parse Google Calendar's left sidebar for available calendars
- Extract calendar names and identifiers from DOM elements
- Create dropdown UI for calendar selection

#### DOM Selectors Research
```javascript
// Potential selectors for calendar list (may change with Google updates)
const calendarSelectors = [
  '[data-calendarlistapi-enabled] [role="button"]',
  '.gb_ta [data-calendar-id]',
  '.cal-sidebar-calendar-list [data-calendarlistapi-enabled]',
  '[data-calendar-name]'
];

// Extract calendar information
function extractAvailableCalendars() {
  const calendars = [];
  // Implementation depends on current DOM structure
  return calendars;
}
```

#### Advantages
✅ Dynamic calendar discovery
✅ Better user experience with visual selection
✅ Automatically adapts to user's calendar setup
✅ Provides calendar names and colors

#### Limitations
❌ Fragile - Google Calendar DOM changes frequently
❌ Requires extensive testing and maintenance
❌ May break with Google Calendar updates
❌ More complex implementation

### 3. Google Calendar API Integration

#### Implementation Details
- Use Google Calendar API to fetch user's calendar list
- Requires OAuth authentication and additional permissions
- Implement proper calendar selection UI

#### Required Permissions
```json
{
  "permissions": [
    "https://www.googleapis.com/auth/calendar.readonly"
  ]
}
```

#### Advantages
✅ Most robust and reliable method
✅ Official Google API support
✅ Rich calendar metadata available
✅ Future-proof implementation

#### Limitations
❌ Requires additional OAuth setup complexity
❌ More permissions requested from users
❌ Significantly more complex implementation
❌ API rate limits and quotas

---

## User Experience Design Options

### Option 1: Syntax-Based Selection
Add calendar selection to natural language syntax:

```
// Examples of enhanced syntax
"Meeting tomorrow 2pm @work"
"Doctor appointment Friday 10am @personal"
"Team standup Monday 9am @company"
```

#### Implementation
- Parse `@calendar_name` syntax in natural language input
- Map calendar names to calendar IDs
- Include `src` parameter in generated URLs

#### Advantages
✅ Seamless integration with natural language input
✅ Fast for power users
✅ No additional UI elements needed
✅ Consistent with existing `d()` and `l()` syntax

### Option 2: Dropdown Selection
Add calendar dropdown to the Quick Add popup:

```
┌─ Quick Add Event ──────────────────┐
│ Event: Lunch tomorrow 1pm          │
│ Calendar: [Work Calendar ▼]       │
│                                    │
│ [Cancel] [Help] [Create Event]     │
└────────────────────────────────────┘
```

#### Implementation
- Add `<select>` element to existing popup UI
- Populate with available calendars
- Apply selected calendar to event creation

#### Advantages
✅ Visual and intuitive interface
✅ Clear calendar selection
✅ Familiar UI pattern for users
✅ Easier for non-technical users

### Option 3: Smart Defaults with Override
Implement intelligent calendar selection:

```javascript
// Smart defaults based on keywords
const calendarRules = {
  'work|meeting|standup|call': 'work@company.com',
  'personal|doctor|dentist|vacation': 'personal@gmail.com',
  'birthday|anniversary': 'family@gmail.com'
};

// Allow override with @syntax
"Work meeting tomorrow 2pm"  // → work calendar
"Personal meeting tomorrow 2pm @work"  // → work calendar (override)
```

#### Advantages
✅ Intelligent automation
✅ Reduces user decision fatigue
✅ Customizable rules
✅ Override capability when needed

---

## Implementation Recommendations

### Phase 1: Basic URL Parameter Support (Immediate)
1. **Add calendar configuration UI** to extension popup/options
2. **Allow users to configure** their calendar mappings:
   ```json
   {
     "work": "work@company.com",
     "personal": "personal@gmail.com",
     "family": "family.calendar@gmail.com"
   }
   ```
3. **Implement @syntax parsing** in natural language input
4. **Add `src` parameter** to URL generation

### Phase 2: Enhanced User Experience (Future)
1. **Add dropdown to Quick Add popup** for manual calendar selection
2. **Implement smart defaults** based on keyword detection
3. **Add calendar color indicators** in the UI
4. **Allow calendar nickname management** in extension settings

### Phase 3: Advanced Integration (Future)
1. **DOM inspection for dynamic calendar discovery** (with fallbacks)
2. **Google Calendar API integration** for robust calendar management
3. **Calendar-specific settings** (different default reminders, etc.)

---

## Technical Implementation Details

### URL Parameter Integration
```javascript
// Enhanced createEventUrls function
function createEventUrls(text, lang, selectedCalendar = null) {
  const events = text.split(';').map(eventText => eventText.trim()).filter(Boolean);
  
  const urls = events.map(eventText => {
    try {
      // Parse calendar from @syntax or use selected calendar
      const calendarMatch = eventText.match(/@(\w+)/);
      const calendarKey = calendarMatch ? calendarMatch[1] : null;
      const cleanText = eventText.replace(/@\w+/g, '').trim();
      
      const data = parse(cleanText, lang);
      data.action = 'TEMPLATE';
      
      // Add calendar selection
      const calendar = getCalendarId(calendarKey || selectedCalendar);
      if (calendar) {
        data.src = calendar;
      }
      
      const baseUrl = 'https://www.google.com/calendar/event';
      const params = new URLSearchParams(data);
      return `${baseUrl}?${params}`;
    } catch (err) {
      console.log(`Error parsing event: ${err.message}`);
      return null;
    }
  });
  
  return urls.filter(Boolean);
}

// Calendar ID mapping
function getCalendarId(calendarKey) {
  const calendarMappings = getStoredCalendarMappings(); // From extension storage
  return calendarMappings[calendarKey] || null;
}
```

### Storage Schema
```javascript
// Extension storage structure
const calendarSettings = {
  defaultCalendar: "primary",
  calendarMappings: {
    "work": "work@company.com",
    "personal": "personal@gmail.com",
    "family": "family.calendar@gmail.com"
  },
  smartDefaults: {
    enabled: true,
    rules: {
      "work|meeting|standup": "work",
      "personal|doctor|dentist": "personal"
    }
  }
};
```

---

## Risk Assessment

### High Risk
- **Google Calendar DOM changes**: Google frequently updates their interface
- **URL parameter deprecation**: Google might change or remove `src` parameter support

### Medium Risk
- **User configuration complexity**: Users need to know their calendar IDs
- **Calendar ID discovery**: No easy way for users to find calendar IDs

### Low Risk
- **Extension performance**: Minimal impact on extension performance
- **Permissions**: No additional sensitive permissions required for basic implementation

---

## Alternatives Considered

### Calendar API with Event Creation
**Approach**: Use Google Calendar API to directly create events instead of URL templates
**Rejected because**:
- Requires OAuth authentication flow
- Much more complex implementation
- Additional permissions (calendar write access)
- API rate limits and quotas
- Users lose the native Google Calendar event creation UI

### Browser Extension Context Menus
**Approach**: Add calendar selection to right-click context menus
**Rejected because**:
- Inconsistent with current Quick Add workflow
- Less discoverable for users
- Doesn't integrate with natural language input

### Local Calendar Database
**Approach**: Maintain local database of user's calendars
**Rejected because**:
- Data synchronization complexity
- Privacy concerns with local storage
- Maintenance overhead for calendar updates

---

## Conclusion

**Recommended Approach**: Start with **Phase 1 (URL Parameter Support)** using the `src` parameter and @syntax parsing. This provides immediate value with minimal risk and complexity.

**Key Benefits**:
- Simple to implement and maintain
- Works with existing extension architecture
- No additional permissions required
- Users get calendar selection functionality quickly

**Next Steps**:
1. Implement calendar mapping configuration in extension options
2. Add @syntax parsing to natural language processor
3. Integrate `src` parameter into URL generation
4. Create user documentation for calendar configuration
5. Test with various calendar setups and edge cases

This approach balances functionality, complexity, and maintainability while providing a solid foundation for future enhancements.

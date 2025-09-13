// Shared help content for both popup and content script
export const HELP_SECTIONS = [
  {
    title: "Basic Examples:",
    items: [
      '"Clean the house tomorrow 2pm"',
      '"Lunch Friday 1pm to 2pm"',
      '"Doctor appointment next Monday 10am"'
    ]
  },
  {
    title: "Advanced Features:",
    items: [
      { text: "Descriptions:", example: '"Meeting d(discuss project timeline)"' },
      { text: "Locations:", example: '"Dinner l(Applebees)"' },
      { text: "Recurring:", example: '"Team standup every Monday 9am"' },
      { text: "Multiple events:", example: '"Jam session 1pm; Carlos Birthday 5pm every year"' },
      { text: "Calendar targeting:", example: '"Meeting tomorrow 2pm @work"' }
    ]
  },
  {
    title: "Time Formats:",
    items: [
      '"tomorrow", "next week", "Friday"',
      '"2pm", "19:40", "2:30pm"',
      '"10am to 5pm", "9am-10am"'
    ]
  },
  {
    title: "Recurrence Patterns:",
    items: [
      '"every day", "every week", "every month"',
      '"every Monday", "every 2 weeks"'
    ]
  },
  {
    title: "Calendar Nicknames:",
    items: [
      'Set up calendar nicknames in Settings (⚙️ button)',
      'Use @nickname to target specific calendars',
      'Examples: @work, @personal, @gym'
    ]
  },
  {
    title: "Tips:",
    items: [
      'If the extension doesn\'t work for you, go to chrome://extensions/shortcuts to see what other extensions are using the (Command/Control+E) shortcut, and change them to something else.'
    ]
  }
];

// Generate HTML content for help sections
export function generateHelpHTML() {
  return HELP_SECTIONS.map(section => {
    const items = section.items.map(item => {
      if (typeof item === 'string') {
        return `<li>${item}</li>`;
      } else {
        return `<li><strong>${item.text}</strong> ${item.example}</li>`;
      }
    }).join('');
    
    return `
      <div class="help-section">
        <h4>${section.title}</h4>
        <ul>
          ${items}
        </ul>
      </div>
    `;
  }).join('');
}

// Generate quick help text for the subtitle
export const QUICK_HELP_TEXT = 'd(description) - l(location) - multiple events (;) - recurrences "every N days/weeks/etc" - use settings to manage saved calendars';

# Google Calendar Natural Language Input

Quickly create Google Calendar events from natural language - with inspiration from [https://github.com/mtimkovich/rip_quick_add](https://github.com/mtimkovich/rip_quick_add)

![UI for Natural Language Input Extension](https://github.com/user-attachments/assets/ab1752b5-48a4-44dd-9da6-8e831d6b3520)

Quick Add was a Google Calendar feature that enabled creating calendar events from natural language text input. It was removed for no reason, making many people (including myself) unhappy. This is my attempt to carry on its legacy. It uses the [Chrono](https://github.com/wanasit/chrono) library to extract time data from text.

### Samples of supported calendar inputs
1. Go for a run tomorrow 3pm to 430pm
2. Pick up groceries every Wednesday at 730pm
3. Dad's birthday on Nov 5 every year
4. Check with Amazon about returned item refund d(ID was 43300061-901 i think)
5. Date night next Friday; walk dog in 30min 
6. Check engine oil Thursday at 5pm every 6 months; check tires today every 410 days

### Updates 11/4
* Handle multiple events. Just use the `;` to separate the different events you want to enter.
* Handle days of the week in the past week (starting Sunday 00:00). If today was `Tuesday`, when you'd type `Get groceries on Monday at 5pm`, we'd create an event for the *past* Monday (ie `yesterday`). Now, the system recognizes any event start time that was in the last week, not including today or any date specifiers (ie November 1st), and corrects the calendar event to be the *next* Monday.
* Added support for adding locations using the `l()` specifier. Example: `Walk dog l(Fort Greene Park)`.
* Handle special recurrence cases: `every Sunday`, `every Wednesday` now counts as a weekly recurrence. Before, it would parse this as a daily occurence due to the `day` portion of the event.

### Updates 7/23
* Added better `recurrence` handling by allowing `everyday` and `every week` instead of requiring the interval as a number. Now can say `get dinner with Jack B thursday at 5pm every week`
* Added yearly recurrences `every year` to handle birthdays easily. `Wish Dad happy birthday on Aug 5 every year`.
* Added ability to add details to event using the following format: `d(<text to add in description of event>)`. This is useful for adding a link for a TODO, for adding more context to an event, etc.
* Updated UI to make it match Google Calendar Dark Mode.
* Removed foreign languge support (only English now) and context menu support (selecting text and right clicking on it to add it as a calendar event). Slimmed down the package significantly and made it more maintainable.

### Updates 6/13
* Added `recur` functionality using `every n days/weeks/months` to automatically create recurring events
* Example: `Get dinner with friends Friday at 5pm every 3 weeks` or `Go the grocery story on Thursday night every 1 week` will both create recurring events. Note the need to incude the digit `1` before the time intervals in the examples above.
* Widened scope of allowed dates to default dates without a start date to today, starting now, for 1 hour
* Defaulted all events to 1 hour, instead of `allDay`

### Next up
* Better location and detail parsing - `l()` and `d()` are not very elegant.

## How it works

1. Takes a text input e.g. "Dinner friday 7pm"
2. Parses the input to find date info
3. Returns a Google Calendar URL for adding the event to your calendar.

Alternatively, events can be created by pressing `CMD + E` and entering the event info in the text box. Or, select a date and time and right click to create event.

Changes that were made to Max's original Chrome Extension:
1. `CMD + E` to trigger text entry popup (for natural language calendar event entry)
2. The textbox is autofocused when the popup is opened
3. Press `Enter` to create a calendar event
4. Prettied up the error messages
5. Removed multiple language support and languages settings (to save space)

## Link to Chrome Web Store App
[Chrome Extension Link](https://chromewebstore.google.com/detail/google-calendar-natural-l/dpefadnnccbgjhgnnjilfgefcoallmji)

#### Local
If you want to develop locally: the extension should end up in the folder `chrome-extension`, which is the output of the `yarn build` command. This rolls up (using rollup.js) the libraries we need into a single folder, with all of it getting bundled into `background.js` and `popup.js`. 

A good place to start is the `manifest.json` file, which is the master file for all Google Chrome extensions. 

When you're done making changes, simply zip all the files/folders in the `chrome-extension` folder into a single zip file, and that can be uploaded to the Chrome Web Store.

This app uses rollup transpiling to use the JavaScript modules pattern.
* `yarn build`: transpile all scripts into `chrome-extension` directory
* `yarn watch`: transpile all scripts into `chrome-extension` directory and re-transpile automatically on changes

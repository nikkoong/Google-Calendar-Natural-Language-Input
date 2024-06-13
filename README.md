# Google Calendar Natural Language Input

Quickly create Google Calendar events from natural language - forked from [https://github.com/mtimkovich/rip_quick_add](https://github.com/mtimkovich/rip_quick_add)

![updated text entry](https://github.com/nikkoong/quickest-add/assets/47159312/0258b340-e199-44a8-abda-a3aef0d4693a)

Quick Add was a Google Calendar feature that enabled creating calendar events from natural language text input. It was removed for no reason, making many people (including myself) unhappy. This is my attempt to carry on its legacy. It uses the [Chrono](https://github.com/wanasit/chrono) library to extract time data from text.

### Updates 6/13
* Added `recur` functionality using `every n days/weeks/months` to automatically create recurring events
* Example: `Get dinner with friends Friday at 5pm every 3 weeks` or `Go the grocery story on Thursday night every 1 week` will both create recurring events. Note the need to incude the digit `1` before the time intervals in the examples above.
* Widened scope of allowed dates to default dates without a start date to today, starting now, for 1 hour
* Defaulted all events to 1 hour, instead of `allDay`

### Next up
* Allow event location parsing

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

```
yarn install
```

This app uses rollup transpiling to use the JavaScript modules pattern.
* `yarn build`: transpile all scripts into `chrome-extension` directory
* `yarn watch`: transpile all scripts into `chrome-extension` directory and re-transpile automatically on changes

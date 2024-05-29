# Quickest Add

Quickly create Google Calendar events from natural language - forked from [https://github.com/mtimkovich/rip_quick_add](https://github.com/mtimkovich/rip_quick_add)

![preview.png](https://raw.githubusercontent.com/mtimkovich/rip_quick_add/main/preview.png)

Quick Add was a Google Calendar feature that enabled creating calendar events from natural language text input. It was removed for no reason and [upset many people][support]. This is my attempt to carry on its legacy. It uses the [Chrono][chrono] library to extract time data from text.

## How it works

1. Takes a text input e.g. "Dinner friday 7pm"
2. Parses the input to find date info
3. Returns a Google Calendar URL for adding the event to your calendar.

Alternatively, events can be created by pressing `CMD + E` and entering the event info in the text box.

Changes that were made to Max's original Chrome Extension:
1. `CMD + E` to trigger text entry popup (for natural language calendar event entry)
2. The textbox is autofocused when the popup is opened
3. Press `Enter` to create a calendar event
4. Prettied up the error messages
5. Removed multiple language support and languages settings (to save space)

## Link to Chrome Web Store App

#### Local
If you want to develop locally:

```
yarn install
```

This app uses rollup transpiling to use the JavaScript modules pattern.
* `yarn build`: transpile all scripts into `chrome-extension` directory
* `yarn watch`: transpile all scripts into `chrome-extension` directory and re-transpile automatically on changes

import {createEventUrl} from './helpers.js'

function quickAdd(text, lang) {
  const url = createEventUrl(text, lang);

  if (url) {
    chrome.tabs.create({url});
  } else {
    document.getElementById('error').textContent = 'Could not parse time data from input';
  }
}

document.getElementById('add').addEventListener('click', async (e) => {
  const input = document.getElementById('input').value;
  const storage = await chrome.storage.sync.get()
  const lang = storage.lang

  quickAdd(input, lang);
});

document.getElementById('input').addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('input').value;
    const storage = await chrome.storage.sync.get();
    const lang = storage.lang;
    quickAdd(input, lang);
  }
});

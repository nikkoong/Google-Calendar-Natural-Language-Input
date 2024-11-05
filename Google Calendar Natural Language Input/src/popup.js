import {createEventUrls} from './helpers.js'

function quickAdd(text, lang) {
  const urls = createEventUrls(text, lang);

  if (urls.length > 0) {
    urls.forEach(url => {
      chrome.tabs.create({ url });
    });
  } else {
    document.getElementById('error').textContent = 'Please enter a valid event and time';
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

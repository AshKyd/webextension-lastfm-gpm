/* global document, browser */
const he = require('he');
const console = require('./console');

function showBlock(panelId) {
  console.log('showing panel', panelId);
  Array.from(document.querySelectorAll('.panel')).forEach(panel => (panel.className = 'panel hidden'));
  document.getElementById(panelId).className = 'panel visible';
}

const actions = {
  popupInitNotPlaying: () => showBlock('panel-notPlaying'),
  popupInitPlaying: (data) => {
    if (!data || !data.playing) return showBlock('panel-notPlaying');
    const track = he.encode(data.track);
    const artist = he.encode(data.artist);
    const album = he.encode(data.album);
    const html = `
      <a class="track" href="https://www.last.fm/music/${artist}/_/${track}">${track}</a>
      <a class="artist" href="https://www.last.fm/music/${artist}">${artist}</a>
      <a class="album" href="https://www.last.fm/music/${artist}/${album}">${album}</a>
      <div class="image lodpi" style="background:url(${he.encode(data.art)})"></div>
      <a class="image hidpi" href="${he.encode(data.art.replace('=s90', '=s2000'))}" style="background:url(${he.encode(data.art.replace('=s90', '=s200'))})"></a>
    `;
    document.querySelector('.currentTrack').innerHTML = html;
    return showBlock('panel-playing');
  },
  popupInitLogin: () => showBlock('panel-login'),
};

setTimeout(() => browser.runtime.sendMessage({ action: 'popupInit' }), 1);

// send message to tabs
browser.runtime.onMessage.addListener((message) => {
  console.log('popup received', message);
  if (actions[message.action]) {
    console.log(`popup processing "${message.action}"`);
    actions[message.action](message.opts);
  } else {
    console.error(`popup action "${message.action}" not supported`);
  }
});

function login() {
  showBlock('panel-loading');
  console.log('logging in');
  const username = document.getElementById('input-username').value;
  const password = document.getElementById('input-password').value;
  const message = {
    action: 'getSession',
    opts: { username, password },
  };
  console.log('sending message', message);
  browser.runtime.sendMessage(message);
}

document.querySelector('form').addEventListener('submit', login);
document.querySelector('#button-login').addEventListener('click', login);

document.querySelector('#button-open').addEventListener('click', () => {
  browser.tabs.create({
    url: 'https://play.google.com/music/listen#/recents',
  });
});

document.body.addEventListener('click', (e) => {
  if (e.target.href) {
    e.preventDefault();
    browser.tabs.create({
      url: e.target.href,
    });
  }
});

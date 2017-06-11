/* global browser */
const API = require('last.fm.api');
const console = require('./console');

let globalSession;
const apiKey = '1015bb31ee88bdd0ea6a5dabbd6a498f';
const apiSecret = 'a7aefbbb0d67d47b51f17762c88763d1';
const lastfm = new API({
  apiKey,
  apiSecret,
});

const actions = {
  scrobble(opts) {
    if (!globalSession || !globalSession.sessionKey) return console.warn('No session found. Log in to scrobble.');
    const { track, artist, album } = opts;
    const payload = {
      tracks: [
        {
          track,
          artist,
          album,
          timestamp: Math.round(Date.now() / 1000),
        },
      ],
      sk: globalSession.sessionKey, // session key is required
    };

    console.log('scrobbling', payload);

    return lastfm.track.scrobble(payload)
      .then((json) => { console.log(json); })
      .catch((err) => { console.error(err); });
  },
  getSession(opts) {
    const { username, password } = opts;
    const mobileLastFm = new API({
      apiKey,
      apiSecret,
      username,
      password,
    });

    // Get Mobile Session by supplying username and password into API constructor
    mobileLastFm.auth.getMobileSession({})
      .then(json => json.session)
      .then((session) => {
        globalSession = {
          sessionName: session.name,
          sessionKey: session.key,
        };
        browser.storage.local.set(globalSession).catch(err => console.error('Save errored', err));
        actions.popupInit();
      })
      .catch((err) => {
        console.error('ERRORED!', JSON.stringify(err));
        actions.popupInit();
      });
  },
  getCurrentStatus() {
    function onError(error) {
      console.error('getCurrentStatus error', error);
      browser.runtime.sendMessage({ action: 'popupInitNotPlaying' });
    }

    console.log('querying tabs');
    browser.tabs.query({
      url: 'https://play.google.com/music/listen*',
    })
    .then((tabs) => {
      console.log('got response', tabs);
      if (!tabs[0]) {
        console.log('no tabs found');
        return browser.runtime.sendMessage({ action: 'popupInitNotPlaying' });
      }
      console.log('sending message');
      return browser.tabs.sendMessage(tabs[0].id, { action: 'getCurrent' })
        .then((opts) => {
          browser.runtime.sendMessage({ action: 'popupInitPlaying', opts });
        })
        .catch(onError);
    }).catch(onError);
  },
  popupInit() {
    if (!globalSession || !globalSession.sessionKey) return browser.runtime.sendMessage({ action: 'popupInitLogin' });
    return actions.getCurrentStatus();
  },
};

// load previously saved login info
browser.storage.local.get([
  'sessionName',
  'sessionKey',
])
.then(keys => (globalSession = keys))
.catch(error => console.error('couldn\'t load config', error));

// start listening for other scripts to run commands
console.log('background script listening');
browser.runtime.onMessage.addListener((message) => {
  console.log('background received', message);
  if (actions[message.action]) {
    console.log(`background processing "${message.action}"`);
    actions[message.action](message.opts);
  } else {
    console.error(`background action "${message.action}" not supported`);
  }
});

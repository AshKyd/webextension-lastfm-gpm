/* global browser, document */
const refreshInterval = 1000;
let lastScrobble = {};

function trackMatches(a, b) {
  return (a.track === b.track && a.artist === b.artist);
}

const actions = {
  scrobble(data) {
    console.log('scrobbling', data);
    browser.runtime.sendMessage({
      action: 'scrobble',
      opts: data,
    });
  },
  getCurrent() {
    const isPlaying = !!document.querySelectorAll('#player-bar-play-pause[aria-label=Pause]').length;

    // nothing is playing. Return the last playing track with the playing flag false
    if (!isPlaying) {
      return Promise.resolve(Object.assign({ playing: false }));
    }

    // We are playing, so return the track.
    const slider = document.getElementById('sliderBar');
    const data = {
      playing: true,
      track: document.getElementById('currently-playing-title').innerText,
      artist: document.getElementById('player-artist').innerText,
      album: document.querySelectorAll('.player-album')[0].innerText,
      percentPlayed: slider.getAttribute('value') / slider.getAttribute('aria-valuemax'),
      art: document.getElementById('playerBarArt').src,
    };

    return Promise.resolve(data);
  },
};

browser.runtime.onMessage.addListener((request) => {
  if (actions[request]) {
    return actions[request]();
  }
  console.error('content script unsupported command', request);
});


setInterval(() => {
  actions.getCurrent().then((currentPlaying) => {
    const match = trackMatches(currentPlaying, lastScrobble);

    if (!currentPlaying.playing) return;

    if (!match) {
      console.log('not a match, scrobbling')
      lastScrobble = currentPlaying;
      return actions.scrobble(currentPlaying);
    }

    if (match) {
      console.log('is a match');
      if (lastScrobble.percentPlayed > 0.9 && currentPlaying.percentPlayed < 0.1) {
        console.log('track is a repeat')
        actions.scrobble(currentPlaying);
      }
      lastScrobble = currentPlaying;
    }
    return null;
  });
}, refreshInterval);

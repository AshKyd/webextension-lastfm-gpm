/* global document, browser */
function showBlock(panelId) {
  Array.from(document.querySelectorAll('.panel')).forEach(panel => (panel.className = 'panel hidden'));
  document.getElementById(panelId).className = 'panel visible';
}

const actions = {
  popupInitNotPlaying: () => showBlock('panel-notPlaying'),
  popupInitPlaying: () => showBlock('panel-playing'),
  popupInitLogin: () => showBlock('panel-login')
}

browser.runtime.sendMessage({action: 'popupInit'});

// send message to tabs
browser.runtime.onMessage.addListener(function(message){
  console.log('popup received', message);
  if (actions[message.action]) {
    console.log(`popup processing "${message.action}"`);
    actions[message.action](message.opts);
  } else {
    console.error(`popup action "${message.action}" not supported`);
  }
});

document.querySelector('#button-login').addEventListener('click', () => {
  console.log('clicked')
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const message = {
    action: 'getSession',
    opts: { username, password },
  };
  console.log('sending message', message);
  browser.runtime.sendMessage(message);
});

document.querySelector('#button-open').addEventListener('click', () => {
  browser.tabs.create({
    url: 'https://play.google.com/music/listen#/recents',
  });
});

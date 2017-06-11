const log = false;

if (log) {
  module.exports = console;
} else {
  module.exports = {
    error() {},
    log() {},
  };
}

const log = true;

if (log) {
  module.exports = console;
} else {
  module.exports = {
    error() {},
    log() {},
  };
}

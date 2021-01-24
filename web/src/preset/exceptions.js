class PresetDoesNotExistError extends Error {
  constructor(name) {
    super(`Preset does not exist: ${name}`);
    this.name = 'PresetDoesNotExistError';
    this.statusCode = 404;
  }
}

module.exports = {
  PresetDoesNotExistError
}

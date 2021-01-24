class ServerDoesNotExistError extends Error {
  constructor(name) {
    super(`Server does not exist: ${name}`);
    this.name = 'ServerDoesNotExistError';
    this.statusCode = 404;
  }
}

module.exports = {
  ServerDoesNotExistError
}

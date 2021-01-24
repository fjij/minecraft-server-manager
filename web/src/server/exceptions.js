class ServerDoesNotExistError extends Error {
  constructor(name) {
    super(`Server does not exist: ${name}`);
    this.name = 'ServerDoesNotExistError';
    this.statusCode = 404;
  }
}

class ServerAlreadyExistsError extends Error {
  constructor(name) {
    super(`Server already exists: ${name}`);
    this.name = 'ServerAlreadyExistsError';
    this.statusCode = 409;
  }
}

module.exports = {
  ServerDoesNotExistError,
  ServerAlreadyExistsError,
}

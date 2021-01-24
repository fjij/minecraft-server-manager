module.exports = (error, req, res, next) => {
  res.status(error.status || error.statusCode || 500).send({ 
    error: {
      message: error.message
    }
  });
}

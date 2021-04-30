module.exports = (error, req, res, next) => {
  console.error(error);
  res.status(error.status || error.statusCode || 500).send({ 
    error: {
      message: error.message
    }
  });
}

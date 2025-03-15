const { isValidObjectId } = require("mongoose");

exports.checkId = (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    res.status(404);
    throw new Error(`Invalid Object ID: ${req.params.id}`);
  }
  next();
};

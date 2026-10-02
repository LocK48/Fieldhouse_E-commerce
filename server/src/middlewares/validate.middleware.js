const AppError = require("../utils/AppError");

const validate =
  (schema, target = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return next(new AppError(`${field}${issue.message}`, 400));
    }

    req.validated = { ...req.validated, [target]: result.data };
    if (target === "body") req.body = result.data;
    next();
  };

module.exports = validate;

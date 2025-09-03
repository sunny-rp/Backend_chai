const asyncHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    // Only allow valid HTTP status codes (100–599)
    const statusCode =
      typeof error.code === "number" && error.code >= 100 && error.code < 600
        ? error.code
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export { asyncHandler };

// Wraps an async Express route handler so a thrown error (or a rejected
// promise anywhere inside it — e.g. a bad Mongoose cast) is passed to
// Express's error handling instead of crashing the whole Node process.
// Express does NOT catch async errors automatically; without this, one
// bad request (like an unparseable date) can take the entire server down
// for every company, not just return an error to the person who sent it.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };

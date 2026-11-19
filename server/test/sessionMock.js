// Shared by the route tests: requireAuth now checks every session against
// the users collection, so tests that forge a session cookie also stub the
// lookup it makes. (No tests in this file — node --test just loads it.)
const { mock } = require("node:test");
const User = require("../src/models/User");

function mockSessionUser({ userId, companyId, role = "admin", username = "admin" }) {
  const user = {
    _id: userId,
    companyId,
    username,
    role,
    email: null,
    emailVerified: false,
    googleId: null,
    passwordHash: "x",
    sessionVersion: 0,
    mustChangePassword: false,
    termsVersion: require("../src/middleware/auth").TERMS_VERSION,
  };
  return mock.method(User, "findById", () => ({ select: async () => user }));
}

module.exports = { mockSessionUser };

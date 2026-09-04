# Kapa — Development Guidelines

## 1. Project Overview

Kapa is a pet adoption platform developed for an NGO.

The repository is a monorepo.

### Applications

- Mobile: React Native + Expo
- Web: React Native Web
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Authentication: JWT
- Object/file storage: S3-compatible storage
- Cache: Redis

The mobile and web applications share React Native components and business logic whenever practical.

---

# 2. General Rules

These rules apply to ALL development tasks.

1. Prioritize security above convenience.
2. Do not introduce known vulnerabilities.
3. Do not modify the database schema without explicit human approval.
4. Do not introduce deprecated APIs, packages, or patterns.
5. Do not introduce unnecessary dependencies.
6. Follow the project's existing architecture and conventions.
7. Prefer simple, maintainable solutions over unnecessary abstractions.
8. Use strict TypeScript typing. Avoid `any` unless explicitly justified.
9. Do not silently change existing behavior unrelated to the requested task.
10. Do not expose secrets, credentials, tokens, or sensitive user data in source code, logs, errors, or commits.
11. Do not disable security mechanisms to make development easier.
12. Do not make assumptions about security-sensitive behavior. Verify it.

---

# 3. Before Modifying Code

Before implementing a feature:

1. Inspect the relevant existing code.
2. Check the project's architecture and conventions.
3. Check `DESIGN.md` when modifying UI.
4. Check existing tests before creating new ones.
5. Check package versions and existing APIs before introducing a library.
6. For Expo/React Native work, consult the exact Expo SDK version documentation.
7. Identify security implications before implementation.
8. Do not modify unrelated files.

---

# 4. UI / Design

When creating or modifying a screen or UI component:

1. Read `DESIGN.md` first.
2. Follow the project's Material Design system.
3. Use the project's defined color palette, typography, spacing, elevation, and component patterns.
4. Reuse existing components when possible.
5. Do not introduce arbitrary colors, spacing, fonts, or UI patterns.
6. Ensure the component works on both mobile and web when applicable.
7. Consider accessibility:
   - labels
   - touch target sizes
   - keyboard navigation
   - screen readers
   - color contrast
8. Do not use deprecated React Native or Expo APIs.

---

# 5. Expo / React Native

The project uses Expo Router.

Before writing or modifying Expo code, consult the exact versioned Expo documentation:

https://docs.expo.dev/versions/v57.0.0/

Do not rely on documentation for another Expo SDK version when implementing SDK-specific functionality.

When adding a dependency:

1. Verify compatibility with the project's Expo SDK version.
2. Verify React Native compatibility.
3. Verify TypeScript compatibility.
4. Prefer Expo-supported solutions when available.
5. Do not use deprecated APIs.

---

# 6. TypeScript

Use strict TypeScript.

Rules:

- Avoid `any`.
- Prefer explicit domain types.
- Do not use unsafe type assertions to silence compiler errors.
- Validate external data at runtime.
- Do not assume request bodies, query parameters, headers, or external API responses are correctly typed.
- Keep types close to their domain when appropriate.
- Prefer discriminated unions for state-dependent data.

Example:

Bad:

const user = req.body as User;

Good:

const user = userSchema.parse(req.body);

---

# 7. Backend

Backend:

- Node.js
- Express
- TypeScript
- PostgreSQL

Follow a clear separation between:

- routes
- controllers
- services/use cases
- repositories/data access
- domain types
- middleware
- validation
- infrastructure

Controllers should remain thin.

Business logic should not be implemented directly inside route handlers.

---

# 8. Authentication and Authorization

The API uses HTTPS for communication.

JWT is used for authentication and authorization.

Security requirements:

1. Never trust client-provided identity or authorization information.
2. Validate JWT signature, algorithm, issuer, audience, and expiration when applicable.
3. Use short-lived access tokens.
4. Use secure refresh-token handling when refresh tokens are implemented.
5. Never store secrets in source code.
6. Never log access tokens or refresh tokens.
7. Enforce authorization on the server.
8. Do not rely on frontend route protection for security.
9. Prevent IDOR/BOLA vulnerabilities.
10. Verify that the authenticated user has permission to access or modify every resource.
11. Use secure password hashing for passwords.
12. Never return password hashes or sensitive authentication data through the API.

---

# 9. Input Validation

Treat ALL external input as untrusted.

Validate:

- request body
- route parameters
- query parameters
- headers
- uploaded files
- webhook payloads
- external API responses

Use schema validation at the API boundary.

Reject malformed or unexpected input.

Never construct SQL queries by concatenating user input.

---

# 10. Security

Security is the highest priority.

Consider and protect against:

- SQL injection
- XSS
- CSRF where applicable
- SSRF
- IDOR/BOLA
- broken authentication
- broken authorization
- brute-force attacks
- credential stuffing
- rate-limit bypass
- path traversal
- malicious file uploads
- prototype pollution
- command injection
- insecure deserialization
- sensitive information disclosure
- mass assignment
- dependency vulnerabilities
- denial-of-service through expensive requests

Use:

- HTTPS
- secure headers
- appropriate CORS configuration
- rate limiting
- request size limits
- input validation
- output sanitization/encoding where appropriate
- secure cookie configuration when cookies are used
- least-privilege database credentials
- secret management
- structured security logging

Never implement a security mechanism that only exists on the client.

---

# 11. Database

PostgreSQL is the project's database.

IMPORTANT:

Do NOT:

- modify the schema
- create migrations
- delete tables
- change columns
- change constraints
- modify indexes

without explicit human approval.

If a feature requires a database change:

1. Explain why the change is necessary.
2. Describe the proposed schema change.
3. Wait for human approval.
4. Only then implement the migration.

Never silently modify the database to make tests or development work.

---

# 12. Tests

Every new feature or component must include appropriate tests.

### UI components

Test:

- rendering
- user interactions
- important states
- error states
- accessibility where appropriate

### Backend

Test:

- successful requests
- validation failures
- authentication failures
- authorization failures
- edge cases
- error handling

### Security-sensitive code

Include tests for:

- unauthorized access
- privilege escalation
- invalid tokens
- expired tokens
- malformed input
- resource ownership
- common attack scenarios

Do not remove or weaken existing tests to make a feature pass.

---

# 13. Logging

Use structured logging.

Never log:

- passwords
- JWTs
- refresh tokens
- API keys
- database credentials
- sensitive personal information

Logs should contain enough information to diagnose failures without exposing secrets.

Use correlation/request IDs where appropriate.

---

# 14. Error Handling

Do not expose internal implementation details to clients.

Bad:

{
  "error": "Postgres connection failed at 192.168..."
}

Prefer:

{
  "error": "Internal server error"
}

Detailed information should remain in secure server logs.

Use consistent API error formats.

---

# 15. Dependencies

Before adding a package:

1. Check whether the project already has a solution.
2. Verify the package is maintained.
3. Verify compatibility with the project's versions.
4. Check for known vulnerabilities.
5. Prefer established and minimal dependencies.
6. Do not add a package for functionality that can reasonably be implemented with existing dependencies.

---

# 16. Code Quality

Prefer:

- small functions
- clear names
- single responsibility
- explicit types
- predictable control flow
- reusable abstractions only when justified
- immutable data where practical
- consistent error handling

Avoid:

- unnecessary abstractions
- duplicated business logic
- deeply nested logic
- giant components
- giant controllers
- unexplained magic numbers
- `any`
- commented-out dead code

---

# 17. Before Finishing a Task

Before considering a task complete:

1. Run TypeScript type checking.
2. Run linting.
3. Run relevant tests.
4. Check for deprecated APIs.
5. Review changed files.
6. Review security implications.
7. Verify no secrets were introduced.
8. Verify no database changes were made without approval.
9. Verify the implementation follows `DESIGN.md` when UI was changed.
10. Report any checks that could not be executed.
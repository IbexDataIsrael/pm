Code Review Report
==================

Repository: Project Management MVP (pm)
Date: 2026-06-08

Summary
-------
This repo is a Dockerized full-stack MVP with a Next.js frontend (exported static site) and a Python FastAPI backend (uvicorn). The core features are present and functional: a persisted Kanban board, a simple local login (MVP), and an AI chat that can propose structured board updates via OpenRouter.

Overall quality is good for an MVP: code is straightforward, tests exist for the backend AI and database pieces, and the Dockerfile ties the two pieces together. However, there are several serious repository hygiene and security issues and a number of smaller correctness/maintainability problems that should be addressed before this project is used in any non-local environment or shared publicly.

High Priority Issues (must fix immediately)
-----------------------------------------
1) Secret committed to repository (.env)
   - Where: project root .env
   - Problem: The file contains a live OPENROUTER_API_KEY (starts with sk-...). Committed secrets are an immediate security risk.
   - Risk: Unauthorized use of the API key, unexpected charges, credential leak.
   - Action (short):
     1. Rotate the API key now (log into OpenRouter and revoke/replace the key).
     2. Remove the committed .env from Git and replace it with an example file.
        - git rm --cached .env
        - echo "OPENROUTER_API_KEY=YOUR_KEY_HERE" > .env.example
        - Add .env to .gitignore (already present but file is tracked). Commit the change.
     3. Consider purging the key from history (BFG or git filter-repo) if the repo is public or shared. Example (careful; do with your org's process):
        - Install git-filter-repo and run: git filter-repo --path .env --invert-paths
        - Or use BFG to remove the literal value: bfg --delete-files .env
     4. After history purge, force-push to protected branches only with consent and coordinate team.

2) Large build artifacts and virtualenvs are committed
   - Where: frontend/.next, frontend/out, backend/.venv, many compiled artifacts (.pyc, .map, build chunks)
   - Problem: These increase repo size, leak environment-specific files, and should not be in source control.
   - Action:
     - Remove tracked artifacts and add proper ignores:
       - git rm -r --cached frontend/.next frontend/out backend/.venv
       - (Also remove committed __pycache__, .pyc, node_modules-like build output)
       - Commit and push. Add entries to .gitignore where missing.
     - Prefer building in CI or Docker instead of committing build outputs.

3) Sensitive env file and virtualenv present in .git history and working tree
   - See items above; treat as combined issue: remove tracked files, rotate secrets, purge history if needed.

Medium Priority Issues (fix soon)
--------------------------------
4) No authentication / security boundary on API endpoints
   - Where: backend app.main routes (GET /api/board, PUT /api/board, POST /api/ai/chat)
   - Problem: APIs are unprotected (MVP design uses frontend-local session only). This is OK for local dev but dangerous if the server is exposed.
   - Action: Document clearly in README and docs that server must not be exposed publicly. If you plan to expose it, add at least basic auth or token validation.

5) Hardcoded MVP credentials in frontend
   - Where: frontend/src/components/AuthenticatedKanban.tsx (USERNAME/PASSWORD = user/password)
   - Problem: Storing credentials in client code is insecure (even for MVP). This is acceptable for local demo but must be documented and replaced before production.
   - Action: Keep for local dev only; move credentials to a backend-configured check or environment variable if needed.

6) Committed venv and compiled artifacts in backend/.venv and other noisy files
   - Where: backend/.venv/ and many .pyc files
   - Problem: Inflates repo and can leak platform-specific binaries.
   - Action: Remove tracked venv and add clear dev setup instructions (uv / python -m venv .venv) and .venv in .gitignore.

7) Tests and build artifacts checked in
   - Where: frontend/out, many .next and .map files, test-results
   - Problem: Built output and CI artifacts are committed. This makes diffs noisy and bloats repository.
   - Action: Delete build artifacts from repo and ensure .gitignore prevents recurrence.

Low Priority / Suggested Improvements
------------------------------------
8) Improve OpenRouter response handling and logging
   - Where: backend/app/ai.py and backend/app/ai_chat.py
   - Observations:
     - call_openrouter_messages swallows httpx.HTTPError and raises a generic OpenRouterRequestError. Including response status/text (careful not to log secrets) would aid debugging.
     - run_ai_chat expects json_response=True and then expects a JSON string back; parsing logic in parse_structured_ai_response is defensive and reasonable but could use more tests for edge cases.
   - Action:
     - Add structured logging around network calls and include response.status_code and truncated body on non-200 for diagnostics (make logs redacted for secrets).
     - Add unit tests for parse_structured_ai_response covering: plain text reply, fenced code blocks, JSON with null board, malformed JSON, nested JSON, and JSON containing unexpected types.

9) Validation: Prefer pydantic models for request/response bodies where appropriate
   - Where: backend/app/main.py and board validation
   - Action: Consider using pydantic BaseModel for board payloads and AI chat messages so incoming JSON is validated earlier with better error messages.

10) Improve types and docstrings
   - Action: Add docstrings for exported functions in backend/app/ai.py, ai_chat.py, and database.py. Add mypy/ruff/linting to CI.

Code Quality Findings (by file)
------------------------------
- backend/app/ai.py
  - get_openrouter_api_key reads process env then falls back to project .env file. This is convenient for local dev but you should not commit .env. (lines ~21-34)
  - call_openrouter_messages constructs requests and raises OpenRouterRequestError on any httpx error (lines ~68-83). Consider surfacing error details for debugging but redact sensitive values.

- backend/app/ai_chat.py
  - run_ai_chat constructs the system prompt containing full current board JSON (line ~56). That can be large; consider truncation or summarization if boards become large.
  - parse_structured_ai_response implements robust parsing for JSON embedded in text and fallback behavior (lines ~74-118). Add more tests for malformed responses.

- backend/app/database.py
  - validate_board enforces a strict shape for boards and checks for duplicate card ids (lines ~169-206). Good defensive validation.
  - Database initialization and persistence are straightforward and use parameterized SQL (safe). For concurrency, sqlite is fine for single-process local MVP but document scale limits.

- backend/app/main.py
  - Static file handler uses FileResponse and ensures resolved path is within STATIC_DIR (lines ~101-109). Good path-checking.

- frontend/
  - AuthenticatedKanban handles the local session in localStorage and uses USERNAME/PASSWORD in client code (lines ~9-12 and ~60-67). This is acceptable for a local demo but must be clearly documented and removed before wider distribution.
  - boardApi.ts wraps API calls and returns helpful errors. Consider surfacing server error detail consistently. (frontend/src/lib/boardApi.ts)

Repository Hygiene / CI Recommendations
------------------------------------
1. Add or enforce pre-commit hooks (pre-commit) with these checks:
   - trailing-whitespace, end-of-file-fixer
   - ruff/black or eslint/Prettier for frontend
   - detect-secrets or git-secrets scanning to prevent future commits of secrets

2. Add a minimal CI pipeline that runs:
   - Backend: uv run pytest (as repo already has tests)
   - Frontend: npm ci && npm run test:unit
   - Linting (ruff/eslint)

3. Reduce repo size and noise by removing build artifacts and venvs (see immediate actions above).

Testing / Missing Tests
-----------------------
- Add unit tests for parse_structured_ai_response that cover:
  - Bare JSON response
  - JSON embedded in markdown fences
  - Plain text reply
  - Malformed JSON falling back to text
  - Board validation failure path

- Add integration tests (backend) to verify that the /api/ai/chat endpoint returns 400/502 on malformed AI replies and that board updates are persisted correctly.

Suggested Immediate Action Plan (order, commands)
------------------------------------------------
1) Rotate the OpenRouter API key now in OpenRouter dashboard.
2) Remove sensitive file from git tracking and replace with .env.example:
   - git rm --cached .env
   - echo "OPENROUTER_API_KEY=REPLACE_ME" > .env.example
   - git add .env.example
   - git commit -m "ci: remove committed .env; add .env.example"

3) Remove build and venv artifacts from the repository and commit the removal:
   - git rm -r --cached frontend/.next frontend/out backend/.venv
   - git rm -r --cached **/__pycache__ **/*.pyc
   - git commit -m "chore: remove build artifacts and venv from repo"

4) If the repository is public or the secret was used in public infrastructure, purge history (coordinate with team):
   - Use git-filter-repo or BFG. Example (use carefully):
     - pip install git-filter-repo
     - git clone --mirror <repo-url> repo.git
     - cd repo.git
     - git filter-repo --path .env --invert-paths
     - git push --force

5) Add pre-commit and secret scanning to block future accidental commits. Example minimal steps:
   - pip install pre-commit
   - Create .pre-commit-config.yaml with hooks: detect-secrets, ruff, end-of-file-fixer
   - pre-commit install

6) Add docs: update README and docs/RUNNING.md to emphasize "DO NOT COMMIT .env or .venv" and include local dev steps.

Owners / Who should do what
---------------------------
- Rotate API key: Owner with OpenRouter account (Ops / Project Owner) — immediate
- Clean repo of secrets and build artifacts: Repo maintainer (Git expertise required) — immediate
- Add pre-commit & CI: Dev lead or contributor familiar with CI — next sprint
- Add tests and logging improvements: Backend owner / senior engineer — next sprint

Appendix: Short checklist
------------------------
- [ ] Rotate OPENROUTER_API_KEY
- [ ] Remove .env from git (git rm --cached .env) and add .env.example
- [ ] Remove frontend/.next, frontend/out, backend/.venv, __pycache__, .pyc from repo
- [ ] Add pre-commit (detect-secrets) and install hooks
- [ ] Add CI jobs for tests and linting
- [ ] Add unit tests for AI response parsing and board validation
- [ ] Document security considerations in README and docs/

End of report

# Project Implementation Plan

This plan breaks the Project Management MVP into small phases. Each phase should be completed, tested, and reviewed before moving to the next one. Keep the implementation simple and focused on the MVP described in `AGENTS.md`.

## Part 1: Planning and Project Context

Goal: turn this plan into an actionable checklist, document the existing frontend, and get user approval before implementation begins.

Checklist:

- Review `AGENTS.md` and confirm the product requirements, limitations, technical decisions, and coding standards are understood.
- Review the existing `frontend/` app structure, dependencies, test setup, and current Kanban demo behavior.
- Create `frontend/AGENTS.md` describing the existing frontend code, how it is organized, how to run/test it, and any important implementation patterns.
- Confirm the intended phase order with the user before coding begins.
- Keep this plan updated as phases are completed.

Tests:

- No code tests required for this planning-only phase.
- Verify documentation is accurate by checking the referenced files and commands exist.

Success criteria:

- `docs/PLAN.md` contains a clear implementation checklist.
- `frontend/AGENTS.md` exists and accurately describes the frontend.
- The user has reviewed and approved the plan before implementation work starts.

## Part 2: Scaffolding

Goal: create the Docker, backend, and script foundation without integrating the full frontend yet.

Checklist:

- Create a `backend/` FastAPI app with a minimal project structure.
- Configure Python dependency management with `uv`.
- Add a health endpoint, such as `GET /api/health`, returning a simple JSON response.
- Serve simple static HTML at `/` from the FastAPI app to prove static serving works.
- Add Docker infrastructure to build and run the app locally in one container.
- Add start and stop scripts in `scripts/` for Windows, macOS, and Linux.
- Document the local run flow in the minimal README or docs as needed.

Tests:

- Add backend tests for the health endpoint.
- Add a basic test that confirms `/` serves the static hello world page.
- Manually run the Docker container and verify the app is reachable locally.
- Run the start and stop scripts on the current OS.

Success criteria:

- The app runs locally in Docker.
- Visiting `/` returns a hello world page served by FastAPI.
- Calling `/api/health` returns a successful JSON response.
- Backend tests pass.

## Part 3: Add the Existing Frontend

Goal: build the existing Next.js frontend as static assets and serve it from the FastAPI backend at `/`.

Checklist:

- Review the current Next.js configuration and adjust it for static export if needed.
- Add a frontend build step to the Docker build.
- Copy the built static frontend into the backend-served static directory.
- Ensure `/` displays the existing Kanban demo instead of the hello world page.
- Keep frontend behavior unchanged except where required for static serving.
- Preserve the existing visual style and color scheme from `AGENTS.md`.

Tests:

- Run frontend unit tests.
- Run frontend integration or end-to-end tests if already configured.
- Add or update tests proving the Kanban board renders at `/`.
- Manually verify the Dockerized app serves the frontend at `/`.

Success criteria:

- Docker build includes the frontend build.
- The FastAPI app serves the static Next.js output at `/`.
- The demo Kanban board is visible and usable locally.
- Relevant frontend and backend tests pass.

## Part 4: Fake User Sign In

Goal: require a simple local sign in before showing the Kanban board.

Checklist:

- Add a login screen shown when the user is not signed in.
- Accept only the hardcoded MVP credentials: username `user`, password `password`.
- Add logout behavior that returns the user to the login screen.
- Store only minimal local session state needed for the MVP.
- Keep the implementation simple and avoid building a full authentication system.
- Ensure the app still supports the future backend model of multiple users.

Tests:

- Add tests for successful login with `user` and `password`.
- Add tests for rejected login with incorrect credentials.
- Add tests for logout.
- Add tests proving the Kanban board is hidden until login succeeds.

Success criteria:

- Visiting `/` starts at the login experience when signed out.
- Correct credentials show the Kanban board.
- Incorrect credentials do not show the Kanban board.
- Logout works.
- Tests pass.

## Part 5: Database Modeling

Goal: design the SQLite persistence model before implementing backend storage.

Checklist:

- [x] Propose a SQLite schema that supports multiple users in the future.
- [x] Support one board per signed-in user for the MVP.
- [x] Store the Kanban board as JSON, including columns, cards, card ordering, and column names.
- [x] Define the initial default board JSON for a new user.
- [x] Document how the database file is created when missing.
- [x] Document how schema initialization or migration is handled for the MVP.
- [x] Save the database design in `docs/`.
- [x] Get user sign-off before backend database implementation.

Tests:

- [x] No implementation tests required before approval.
- [x] Review the proposed schema against the MVP requirements.

Success criteria:

- [x] A database design document exists in `docs/`.
- [x] The design covers user records, board records, and JSON board persistence.
- [x] The user approves the database approach before implementation starts.

## Part 6: Backend Persistence API

Goal: add backend routes that read and update a user's persisted Kanban board.

Checklist:

- [x] Add SQLite setup that creates the database if it does not exist.
- [x] Add schema initialization for the approved database model.
- [x] Add backend data access functions for users and boards.
- [x] Add an API route to fetch the current user's Kanban board.
- [x] Add an API route to update the current user's Kanban board.
- [x] Seed or create the default board for the MVP user when needed.
- [x] Validate board JSON shape enough to protect the app from malformed requests.
- [x] Keep authentication simple and aligned with the fake login phase.

Tests:

- [x] Add unit tests for database initialization.
- [x] Add unit tests for creating or loading the default board.
- [x] Add API tests for fetching a board.
- [x] Add API tests for updating a board.
- [x] Add tests for malformed board update requests.

Success criteria:

- [x] Backend creates the SQLite database automatically when missing.
- [x] The MVP user can fetch and update a board through API routes.
- [x] Board changes persist across backend restarts.
- [x] Backend tests pass.

Implementation notes:

- The backend exposes `GET /api/board` and `PUT /api/board` for the hardcoded MVP user, returning and accepting `{ "board": ... }`.
- Board persistence writes the complete board JSON to SQLite. Validation stays intentionally focused on the frontend `BoardData` shape, card references, and duplicate card placement.
- Database initialization is idempotent: create the parent directory and schema, ensure the MVP user, and seed the default board only when missing.

## Part 7: Frontend and Backend Integration

Goal: make the Kanban UI use the backend API so board state persists.

Checklist:

- [x] Replace frontend-only board state initialization with an API fetch after login.
- [x] Save column rename, card edit, and drag-and-drop changes through the backend API.
- [x] Show a simple loading state while the board is fetched.
- [x] Show a simple error state if the board cannot be loaded or saved.
- [x] Keep UI interactions close to the existing demo behavior.
- [x] Avoid complex offline sync or optimistic conflict handling for the MVP.

Tests:

- [x] Add frontend tests for loading board data from the API.
- [x] Add frontend tests for saving board changes.
- [x] Add integration or end-to-end tests covering login, board load, edit, and persistence.
- [x] Manually verify changes persist after refreshing the page and restarting the container.

Success criteria:

- [x] The frontend reads board state from the backend.
- [x] Board changes are saved through the backend.
- [x] Refreshing the page preserves the latest board state.
- [x] Relevant frontend, backend, and integration tests pass.

Implementation notes:

- After login, the frontend fetches the persisted board before rendering the Kanban UI.
- Board changes update local UI state immediately and then save the whole board with `PUT /api/board`.
- Loading, load failure, saving, and save failure states are intentionally simple; the MVP does not include offline sync, retries, or conflict handling.

## Part 8: AI Connectivity

Goal: prove the backend can call OpenRouter using the configured model.

Checklist:

- [x] Read `OPENROUTER_API_KEY` from the project root `.env`.
- [x] Configure the backend to call OpenRouter using model `openai/gpt-oss-120b`.
- [x] Add a minimal backend service function for AI calls.
- [x] Add a simple API route or test-only path to verify AI connectivity.
- [ ] Test with a simple prompt such as `2+2`.
- [x] Avoid exposing the API key to the frontend.

Tests:

- [x] Add unit tests around AI request construction with network calls mocked.
- [x] Add an integration test or manual verification path for a real OpenRouter call when the API key is available.
- [x] Verify missing API key behavior fails clearly.

Success criteria:

- [ ] Backend can make a successful OpenRouter call locally.
- [ ] The simple connectivity prompt returns a sensible response.
- [x] API key remains server-side only.
- [ ] Tests pass, with real network-dependent tests clearly separated if needed.

Implementation notes:

- The backend exposes `POST /api/ai/test` with an optional `{ "prompt": "..." }` body. If omitted, the prompt defaults to `2+2`.
- `app/ai.py` reads `OPENROUTER_API_KEY` from the process environment first, then from the project root `.env` for local development.
- AI calls use OpenRouter's chat completions API with model `openai/gpt-oss-120b`; the frontend never receives or reads the API key.
- Tests mock OpenRouter by default. The real connectivity test is skipped unless `OPENROUTER_API_KEY` is configured.

## Part 9: AI Structured Kanban Updates

Goal: have the backend send the board, user message, and conversation history to the AI, then parse a structured response that may update the board.

Checklist:

- [x] Define the structured AI response schema, including user-facing text and an optional board update.
- [x] Include the current Kanban board JSON in the AI prompt.
- [x] Include the user's latest message in the AI prompt.
- [x] Include conversation history in the AI prompt.
- [x] Add backend logic to validate the structured AI response.
- [x] Apply the board update only if the response includes a valid updated board.
- [x] Persist valid AI-generated board changes to SQLite.
- [x] Return both the assistant message and whether the board changed to the frontend.
- [x] Keep prompts small and explicit enough for the MVP.

Tests:

- [x] Add unit tests for structured response parsing.
- [x] Add unit tests for rejecting invalid board updates.
- [x] Add backend API tests with mocked AI responses that update the board.
- [x] Add backend API tests with mocked AI responses that only reply in chat.
- [x] Add persistence tests proving AI board updates are saved.

Success criteria:

- [x] AI chat endpoint can return a text response without changing the board.
- [x] AI chat endpoint can return a valid board update and persist it.
- [x] Invalid AI board updates are rejected safely.
- [ ] Tests pass.

Implementation notes:

- The backend exposes `POST /api/ai/chat` with `{ "message": "...", "history": [...] }`.
- The AI prompt includes the current board JSON, the latest user message, and up to 10 valid user/assistant history messages.
- The expected AI response is JSON: `{ "message": "...", "board": null }` for chat-only replies, or the same shape with a complete updated board object.
- Board updates are validated with the existing board validator before being persisted. Invalid AI responses return an upstream-style error and are not saved.

## Part 10: AI Chat Sidebar UI

Goal: add a polished sidebar chat experience that can ask the backend AI endpoint to answer questions and update the Kanban board.

Checklist:

- [x] Add a sidebar chat widget to the Kanban UI.
- [x] Display conversation history in the sidebar.
- [x] Let the user send a message to the backend AI endpoint.
- [x] Show loading state while waiting for the AI response.
- [x] Show the assistant response in the chat history.
- [x] Refresh the Kanban board automatically when the AI updates it.
- [x] Preserve existing Kanban interactions alongside the chat.
- [x] Keep the UI consistent with the project color scheme.
- [x] Avoid extra AI features beyond chat-driven board updates for the MVP.

Tests:

- [x] Add frontend tests for opening and using the chat sidebar.
- [x] Add frontend tests for sending a message and rendering the assistant response.
- [x] Add frontend tests for refreshing the board after an AI update.
- [ ] Add end-to-end tests covering login, chat request, AI response, and board refresh with mocked AI where appropriate.

Success criteria:

- [x] The chat sidebar is usable from the Kanban page.
- [x] User messages and assistant responses appear in order.
- [x] AI-generated board updates refresh the visible board automatically.
- [x] Existing Kanban edit and drag-and-drop behavior still works.
- [x] Relevant tests pass.

Implementation notes:

- `AiChatSidebar` renders on the Kanban page and calls `POST /api/ai/chat` through `sendAiChatMessage`.
- The sidebar keeps local conversation history for the current page session.
- When the backend returns `boardChanged: true`, the authenticated app refreshes the board from `GET /api/board`.
- The MVP keeps chat state simple: no persistence, retry queue, or offline handling.

## Overall Definition of Done

- The app runs locally in Docker.
- A user can log in with `user` and `password`.
- The user can view, rename, edit, and drag Kanban items.
- Kanban state persists in SQLite.
- The AI sidebar can answer questions and optionally update the Kanban.
- OpenRouter is called only from the backend.
- Tests cover the backend, frontend, and main user flows.
- Documentation stays concise and accurate.


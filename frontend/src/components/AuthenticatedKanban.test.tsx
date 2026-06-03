import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthenticatedKanban } from "@/components/AuthenticatedKanban";
import { initialData, type BoardData } from "@/lib/kanban";

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const mockBoardApi = (board: BoardData = initialData) => {
  const fetchMock = vi.fn((url: RequestInfo | URL, options?: RequestInit) => {
    if (url === "/api/board" && options?.method === "PUT") {
      return Promise.resolve(jsonResponse(JSON.parse(options.body as string)));
    }

    if (url === "/api/board") {
      return Promise.resolve(jsonResponse({ board }));
    }

    return Promise.reject(new Error(`Unexpected request: ${String(url)}`));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const signIn = async () => {
  await userEvent.type(screen.getByLabelText(/username/i), "user");
  await userEvent.type(screen.getByLabelText(/password/i), "password");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("AuthenticatedKanban", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows login and hides the board when signed out", async () => {
    mockBoardApi();
    render(<AuthenticatedKanban />);

    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeVisible();
    expect(screen.queryByRole("heading", { name: /kanban studio/i })).not.toBeInTheDocument();
  });

  it("shows the board after successful login", async () => {
    const fetchMock = mockBoardApi();
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await signIn();

    expect(await screen.findByRole("heading", { name: /kanban studio/i })).toBeVisible();
    expect(window.localStorage.getItem("pm-mvp-session")).toBe("user");
    expect(fetchMock).toHaveBeenCalledWith("/api/board");
  });

  it("rejects incorrect credentials", async () => {
    mockBoardApi();
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await userEvent.type(screen.getByLabelText(/username/i), "wrong");
    await userEvent.type(screen.getByLabelText(/password/i), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/use username user and password password/i)).toBeVisible();
    expect(screen.queryByRole("heading", { name: /kanban studio/i })).not.toBeInTheDocument();
  });

  it("logs out and returns to login", async () => {
    mockBoardApi();
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await signIn();
    await screen.findByRole("heading", { name: /kanban studio/i });
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeVisible();
    expect(window.localStorage.getItem("pm-mvp-session")).toBeNull();
  });

  it("saves board changes through the API", async () => {
    const fetchMock = mockBoardApi();
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await signIn();
    const firstColumn = await screen.findByTestId("column-col-backlog");
    const titleInput = within(firstColumn).getByLabelText("Column title");

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Ideas");

    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/board",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining('"title":"Ideas"'),
      })
    );
    expect(firstColumn).toBeVisible();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthenticatedKanban } from "@/components/AuthenticatedKanban";

const signIn = async () => {
  await userEvent.type(screen.getByLabelText(/username/i), "user");
  await userEvent.type(screen.getByLabelText(/password/i), "password");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("AuthenticatedKanban", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows login and hides the board when signed out", async () => {
    render(<AuthenticatedKanban />);

    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeVisible();
    expect(screen.queryByRole("heading", { name: /kanban studio/i })).not.toBeInTheDocument();
  });

  it("shows the board after successful login", async () => {
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await signIn();

    expect(screen.getByRole("heading", { name: /kanban studio/i })).toBeVisible();
    expect(window.localStorage.getItem("pm-mvp-session")).toBe("user");
  });

  it("rejects incorrect credentials", async () => {
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await userEvent.type(screen.getByLabelText(/username/i), "wrong");
    await userEvent.type(screen.getByLabelText(/password/i), "password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText(/use username user and password password/i)).toBeVisible();
    expect(screen.queryByRole("heading", { name: /kanban studio/i })).not.toBeInTheDocument();
  });

  it("logs out and returns to login", async () => {
    render(<AuthenticatedKanban />);

    await screen.findByRole("heading", { name: /sign in/i });
    await signIn();
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeVisible();
    expect(window.localStorage.getItem("pm-mvp-session")).toBeNull();
  });
});

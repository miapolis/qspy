import { render } from "@testing-library/react";
import App from "./App";

test("renders qspy name", () => {
  const { getByText } = render(<App />);
  const element = getByText(/qspy/i);
  expect(element).toBeInTheDocument();
});

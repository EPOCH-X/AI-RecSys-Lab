import { useMemo, useState } from "react";
import { HomePage } from "../pages/HomePage";
import { QuestionPage } from "../pages/QuestionPage";
import { ResultPage } from "../pages/ResultPage";
import { routes, type RouteKey } from "./router";

export function App() {
  const [route, setRoute] = useState<RouteKey>("home");

  const CurrentPage = useMemo(() => {
    switch (route) {
      case "questions":
        return QuestionPage;
      case "results":
        return ResultPage;
      case "home":
      default:
        return HomePage;
    }
  }, [route]);

  return (
    <div className="shell">
      <div className="shell__inner">
        <nav className="nav" aria-label="Primary">
          {routes.map((item) => (
            <button
              key={item.key}
              className={`nav__button${route === item.key ? " is-active" : ""}`}
              onClick={() => setRoute(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <CurrentPage navigate={setRoute} />
      </div>
    </div>
  );
}

export default App;

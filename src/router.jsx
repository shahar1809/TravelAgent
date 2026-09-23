import { useEffect, useState } from "react";

export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname) return;
  window.history[replace ? "replaceState" : "pushState"]({}, "", to);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return path;
}

// <a> that navigates without a page reload.
export function Link({ to, children, ...rest }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || rest.target) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

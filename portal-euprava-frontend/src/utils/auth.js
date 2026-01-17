export function saveAuth(payload) {
  sessionStorage.setItem("auth", JSON.stringify(payload));
}

export function getAuth() {
  const raw = sessionStorage.getItem("auth");
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  sessionStorage.removeItem("auth");
}

export function isLoggedIn() {
  const auth = getAuth();
  return Boolean(auth?.token);
}

export function getRole() {
  const auth = getAuth();
  return auth?.user?.role ?? null;
}

export function getRoleLabel(role) {
  const map = {
    CITIZEN: "Građanin",
    OFFICER: "Službenik",
    ADMIN: "Administrator",
  };

  return map[role] ?? role;
}


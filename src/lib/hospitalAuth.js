const AUTH_KEY = 'hospital_auth';
const VALID_USER = 'FUNCIONARIOSBULNES';
const VALID_PASS = 'RAYEN';

export function login(username, password) {
  if (
    username.trim().toUpperCase() === VALID_USER &&
    password.trim().toUpperCase() === VALID_PASS
  ) {
    localStorage.setItem(AUTH_KEY, '1');
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === '1';
}

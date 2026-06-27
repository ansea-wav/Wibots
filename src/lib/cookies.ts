// Cross-subdomain cookie helper for session syncing
export function setSharedCookie(name: string, value: string, days = 30) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  
  // Detect if we are on a subdomain of wazle.my.id
  let domainAttr = "";
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith("wazle.my.id")) {
      domainAttr = "; domain=.wazle.my.id";
    }
  }
  
  document.cookie = name + "=" + (value || "") + expires + "; path=/" + domainAttr + "; SameSite=Lax; Secure";
}

export function getSharedCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function eraseSharedCookie(name: string) {
  let domainAttr = "";
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith("wazle.my.id")) {
      domainAttr = "; domain=.wazle.my.id";
    }
  }
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;' + domainAttr;
}

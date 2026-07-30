const KEYS = {
  ACCESS:  'salnaj_access_token',
  REFRESH: 'salnaj_refresh_token',
  USER:    'salnaj_user',
} as const

export const tokenUtils = {
  getAccess:  ()      => localStorage.getItem(KEYS.ACCESS),
  getRefresh: ()      => localStorage.getItem(KEYS.REFRESH),

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(KEYS.ACCESS,  access)
    localStorage.setItem(KEYS.REFRESH, refresh)
  },

  setAccess: (token: string) => localStorage.setItem(KEYS.ACCESS, token),

  clearAll: () => {
    localStorage.removeItem(KEYS.ACCESS)
    localStorage.removeItem(KEYS.REFRESH)
    localStorage.removeItem(KEYS.USER)
  },

  isLoggedIn: () => !!localStorage.getItem(KEYS.ACCESS),
}

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Menu, X, Zap } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { brandConfig } from '@/config/brand.config'
import { cn } from '@/utils'

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setIsMobileOpen(false) }, [location])

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileOpen(false)
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'glass-strong shadow-md py-3'
            : 'bg-transparent py-5'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Salnaj Home">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)', boxShadow: 'var(--shadow-glow)' }}
            >
              <Zap size={18} color="#fff" fill="#fff" />
            </div>
            <span className="font-heading font-800 text-xl" style={{ color: 'var(--color-text-primary)' }}>
              {brandConfig.app.logoText}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {isLanding && (
            <ul className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: 'var(--color-primary-muted)',
                color: 'var(--color-primary)',
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun size={18} />
                : <Moon size={18} />
              }
            </button>

            {/* Auth Buttons — Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>

            {/* Hamburger — Mobile */}
            <button
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              onClick={() => setIsMobileOpen(prev => !prev)}
              aria-label="Toggle menu"
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
        </div>
      )}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-72 md:hidden flex flex-col transition-transform duration-300',
        )}
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-xl)',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <span className="font-heading font-700 text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {brandConfig.app.logoText}
          </span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-5 flex flex-col gap-1">
          {isLanding && navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.href)}
              className="w-full text-left px-4 py-3 rounded-xl font-heading font-600 transition-colors"
              style={{
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-muted)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="p-5 flex flex-col gap-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Link to="/login" className="btn btn-outline w-full justify-center">Log in</Link>
          <Link to="/register" className="btn btn-primary w-full justify-center">Get Started</Link>
        </div>
      </aside>
    </>
  )
}

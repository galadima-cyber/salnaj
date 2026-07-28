import { Link } from 'react-router-dom'
import { Zap, Mail, Phone, Globe, Share2, ArrowUpRight } from 'lucide-react'
import { brandConfig } from '@/config/brand.config'

const footerLinks = {
  Services: [
    { label: 'Buy Data', href: '/buy-data' },
    { label: 'Buy Airtime', href: '/buy-airtime' },
    { label: 'Pay Electricity', href: '/electricity' },
    { label: 'Cable TV', href: '/cable-tv' },
    { label: 'Education Pins', href: '/education' },
    { label: 'Betting Wallet', href: '/betting' },
  ],
  Tools: [
    { label: 'Smart Buy', href: '/smart-buy' },
    { label: 'Data Autopilot', href: '/autopilot' },
    { label: 'Gift Data', href: '/gift-data' },
    { label: 'Bulk SMS', href: '/bulk-sms' },
    { label: 'Recharge Cards', href: '/recharge-cards' },
    { label: 'API Access', href: '/api' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Become a Reseller', href: '/reseller' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

export function Footer() {
  const { contact, app, country } = brandConfig

  return (
    <footer style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))' }}
              >
                <Zap size={18} color="#fff" fill="#fff" />
              </div>
              <span className="font-heading text-xl" style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {app.logoText}
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)', maxWidth: '260px' }}>
              {app.description}
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-2">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
                <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                {contact.email}
              </a>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }}>
                <Phone size={14} style={{ color: 'var(--color-secondary)' }} />
                {contact.phone}
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-2 mt-5">
              {[
                { icon: Globe,  href: `https://instagram.com/${contact.instagram.replace('@','')}`, label: 'Instagram' },
                { icon: Share2, href: `https://twitter.com/${contact.twitter.replace('@','')}`, label: 'Twitter / X' },
                { icon: Share2, href: `https://facebook.com/${contact.facebook}`, label: 'Facebook' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-heading text-sm mb-4" style={{ fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm transition-colors hover:opacity-100 flex items-center gap-1 group"
                      style={{ color: 'var(--color-text-secondary)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © {app.year} {app.name}. All rights reserved. {country.flag} {country.name}
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            Secured & powered by
            <a href="https://vtpass.com" target="_blank" rel="noopener noreferrer" className="ml-1 font-600 hover:underline" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              VTPass
            </a>
            &amp;
            <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="ml-1 font-600 hover:underline" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
              Paystack
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

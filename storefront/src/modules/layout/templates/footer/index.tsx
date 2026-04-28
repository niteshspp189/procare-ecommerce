import LocalizedClientLink from "@modules/common/components/localized-client-link"

const s = {
  footer: { backgroundColor: '#000', color: '#fff', paddingTop: '40px', paddingBottom: '24px' },
  inner: { maxWidth: '1488px', margin: '0 auto', padding: '0 var(--container-padding)' },
  grid: { display: 'grid', gap: '24px', marginBottom: '40px' },
  colTitle: { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' },
  link: { display: 'block', textDecoration: 'none', color: '#888', fontSize: '11px', marginBottom: '10px', transition: 'color 0.2s' },
  socials: { display: 'flex', gap: '12px', marginBottom: '24px' },
  socialIcon: {
    width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#333',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    textDecoration: 'none', fontSize: '14px'
  },
  bottom: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #222', fontSize: '10px', color: '#555', gap: '16px', textAlign: 'center' },
  bottomLinks: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }
}

export default async function Footer() {
  return (
    <footer style={s.footer as any} className="animate-fade-in border-t border-gray-900">
      <div style={s.inner as any} className="px-4 sm:px-0">
        <div style={s.grid as any} className="responsive-grid-4">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h4 style={s.colTitle as any} className="text-white">STORE LOCATOR</h4>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Become a Member</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Sign Up for Email</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Send Us Feedback</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Student Discounts</LocalizedClientLink>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h4 style={s.colTitle as any} className="text-white">GET HELP</h4>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Order Status</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Delivery</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Returns</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Payment Options</LocalizedClientLink>
            <LocalizedClientLink href="/contact" style={s.link} className="hover:text-white transition-colors">Contact Us</LocalizedClientLink>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h4 style={s.colTitle as any} className="text-white">ABOUT PRO CARE</h4>
            <LocalizedClientLink href="/our-story" style={s.link} className="hover:text-white transition-colors">Our Story</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Careers</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white transition-colors">Sustainability</LocalizedClientLink>
            <div className="mt-6 sm:mt-8 flex gap-3 sm:gap-4">
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              </LocalizedClientLink>
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </LocalizedClientLink>
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </LocalizedClientLink>
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h4 style={s.colTitle as any} className="text-white">NEWSLETTER</h4>
            <p className="text-[10px] sm:text-[11px] text-gray-400 mb-3 sm:mb-4 leading-relaxed">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
            <div className="flex bg-[#111] rounded-full overflow-hidden border border-gray-800 focus-within:border-gray-600 transition-colors">
              <input type="email" placeholder="Email Address" className="bg-transparent border-none px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] w-full focus:outline-none" />
              <button className="bg-white text-black px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-bold">JOIN</button>
            </div>
          </div>
        </div>
        <div style={s.bottom as any}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> India</span>
            <span>© {new Date().getFullYear()} Pro Premium Care. All rights reserved.</span>
          </div>
          <div style={s.bottomLinks as any}>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white mb-0">Guides</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white mb-0">Terms of Sale</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white mb-0">Terms of Use</LocalizedClientLink>
            <LocalizedClientLink href="/" style={s.link} className="hover:text-white mb-0">Privacy Policy</LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

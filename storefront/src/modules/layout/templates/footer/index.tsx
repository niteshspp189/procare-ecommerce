import LocalizedClientLink from "@modules/common/components/localized-client-link"

const s = {
  footer: { backgroundColor: '#000', color: '#fff', paddingTop: '60px', paddingBottom: '40px' },
  inner: { maxWidth: '1488px', margin: '0 auto', padding: '0 var(--container-padding)' },
  grid: { display: 'grid', gap: '40px', marginBottom: '60px' },
  colTitle: { fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px' },
  link: { display: 'block', textDecoration: 'none', color: '#888', fontSize: '12px', marginBottom: '12px', transition: 'color 0.2s' },
  socials: { display: 'flex', gap: '16px', marginBottom: '40px' },
  socialIcon: {
    width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#333',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    textDecoration: 'none', fontSize: '16px'
  },
  bottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '20px', borderTop: '1px solid #222', fontSize: '11px', color: '#555', flexWrap: 'wrap', gap: '20px' },
  bottomLinks: { display: 'flex', gap: '20px', flexWrap: 'wrap' }
}

export default async function Footer() {
  return (
    <footer style={s.footer as any} className="animate-fade-in border-t border-gray-900">
      <div style={s.inner as any}>
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
            <div className="mt-8 flex gap-4">
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">f</LocalizedClientLink>
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">𝕏</LocalizedClientLink>
              <LocalizedClientLink href="/" style={s.socialIcon as any} className="hover:bg-white hover:text-black transition-all">📸</LocalizedClientLink>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h4 style={s.colTitle as any} className="text-white">NEWSLETTER</h4>
            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
            <div className="flex bg-[#111] rounded-full overflow-hidden border border-gray-800 focus-within:border-gray-600 transition-colors">
              <input type="email" placeholder="Email Address" className="bg-transparent border-none px-4 py-2 text-[12px] w-full focus:outline-none" />
              <button className="bg-white text-black px-4 py-2 text-[11px] font-bold">JOIN</button>
            </div>
          </div>
        </div>
        <div style={s.bottom as any}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> India</span>
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

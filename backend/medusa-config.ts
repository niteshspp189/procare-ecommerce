import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      ssl: false,
      sslmode: 'disable',
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    path: "/store-backend",
    vite: (_config) => {
      return {
        plugins: [
          {
            name: "procare-admin-branding",
            transformIndexHtml(html: string) {
              return html.replace(
                "</body>",
                `<script>
                  if (window.location.pathname === '/store-backend' || window.location.pathname === '/store-backend/') {
                    window.location.href = '/store-backend/orders';
                  }

                  // ProCare Admin UI Refinement v2.2
                  function applyProfessionalUI() {
                    var h1s = document.querySelectorAll('h1');
                    for (var i = 0; i < h1s.length; i++) {
                      if (h1s[i].innerText.includes('Medusa')) h1s[i].innerText = 'Welcome to ProCare';
                    }
                    
                    var texts = document.querySelectorAll('p, span');
                    for (var i = 0; i < texts.length; i++) {
                       if (texts[i].innerText.includes('account area')) texts[i].innerText = 'Sign in to access the ProCare dashboard';
                       if (texts[i].innerText.includes('Medusa Store')) texts[i].innerText = 'ProCare Store';
                    }

                    var loginLogoContainer = document.querySelector('div[class*="bg-ui-button-neutral"][class*="w-[50px]"]');
                    if (loginLogoContainer && !document.getElementById('procare-login-logo-v2')) {
                      loginLogoContainer.innerHTML = '<img id="procare-login-logo-v2" src="http://shop.mvshoecare.com/procare-logo.png" style="width: 140px; height: auto; object-fit: contain;">';
                      loginLogoContainer.style.background = 'transparent';
                      loginLogoContainer.style.boxShadow = 'none';
                      loginLogoContainer.style.width = 'auto';
                      loginLogoContainer.style.height = 'auto';
                    }

                    // Move Search to Top Right
                    var sidebarSearch = Array.from(document.querySelectorAll('div.px-3')).find(function(el) { return el.innerText.toLowerCase().includes('search') && el.querySelector('button'); });
                    if (sidebarSearch) {
                      sidebarSearch.style.position = 'absolute';
                      sidebarSearch.style.opacity = '0';
                      sidebarSearch.style.pointerEvents = 'none';
                    }

                    var topBar = document.querySelector('div.grid.w-full.grid-cols-2.border-b.p-3');
                    if (topBar) {
                      var rightCol = topBar.children[1];
                      var searchContainer = document.getElementById('procare-header-search-v4');
                      if (rightCol && !searchContainer) {
                        searchContainer = document.createElement('div');
                        searchContainer.id = 'procare-header-search-v4';
                        searchContainer.className = 'flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all ml-auto max-w-[280px] w-full';
                        searchContainer.innerHTML = '<span style="margin-right:8px; opacity:0.6;">🔍</span> <span style="font-size:14px; color:#475569;">Search ProCare...</span> <span style="margin-left:auto; font-size:10px; color:#94a3b8; border:1px solid #e2e8f0; padding:2px 5px; border-radius:5px; background:white;">⌘K</span>';
                        rightCol.prepend(searchContainer);
                        rightCol.classList.add('flex', 'items-center', 'justify-end', 'gap-x-4');
                        searchContainer.onclick = function() {
                           var btn = document.querySelector('div[style*="opacity: 0"] button') || Array.from(document.querySelectorAll('button')).find(function(b) { return b.innerText.toLowerCase().includes('search'); });
                           if (btn) btn.click();
                        };
                      }
                    }

                    // Inject Stats Grid on Dashboard
                    var mainContent = document.querySelector('main');
                    if (mainContent && window.location.pathname.includes('/orders') && !document.getElementById('procare-stats-v4')) {
                      var statsGrid = document.createElement('div');
                      statsGrid.id = 'procare-stats-v4';
                      statsGrid.className = 'flex gap-5 mb-6 px-1';
                      var stats = [
                        { label: 'Total Orders', value: '128', change: '↑ 12%', trend: 'positive' },
                        { label: 'Net Revenue', value: '₹45,200', change: '↑ 8%', trend: 'positive' },
                        { label: 'Avg. Order', value: '₹353', change: 'Stable', trend: 'neutral' },
                        { label: 'Active Customers', value: '842', change: '↑ 24 today', trend: 'positive' }
                      ];
                      statsGrid.innerHTML = stats.map(function(s) { return '<div style="flex:1; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;"><p style="font-size:14px; color:#64748b; margin:0;">'+s.label+'</p><p style="font-size:26px; font-weight:700; color:#0f172a; margin:4px 0;">'+s.value+'</p><p style="font-size:12px; color:'+(s.trend==='positive'?'#16a34a':'#94a3b8')+'">'+s.change+'</p></div>'; }).join('');
                      var contentInner = mainContent.querySelector('div') || mainContent;
                      contentInner.prepend(statsGrid);
                    }
                  }

                  function hideAdminSidebarItems() {
                    var targets = ['Developer', 'Publishable API Keys', 'Secret API Keys', 'Workflows', 'Documentation', 'Changelog'];
                    var links = ['publishable-api-keys', 'secret-api-keys', 'workflows'];
                    
                    document.querySelectorAll('p, span, a').forEach(function(el) {
                      var text = (el.textContent || '').trim();
                      if (targets.indexOf(text) !== -1) {
                        if (text === 'Developer') {
                          var parent = el.parentElement;
                          while (parent && parent.tagName !== 'BODY') {
                            if (parent.classList.contains('px-2') && parent.classList.contains('flex')) {
                              parent.style.setProperty('display', 'none', 'important');
                              if (parent.nextElementSibling) parent.nextElementSibling.style.setProperty('display', 'none', 'important');
                              break;
                            }
                            parent = parent.parentElement;
                          }
                        }
                        var container = el.closest('li') || el.closest('[data-sidebar-item]') || el;
                        if (container) container.style.setProperty('display', 'none', 'important');
                      }
                    });

                    links.forEach(function(link) {
                      document.querySelectorAll('a[href*="' + link + '"]').forEach(function(el) {
                         var container = el.closest('li') || el.closest('[data-sidebar-item]') || el;
                         container.style.setProperty('display', 'none', 'important');
                      });
                    });
                  }

                  setInterval(applyProfessionalUI, 1200);
                  setInterval(hideAdminSidebarItems, 250);
                  window.addEventListener('DOMContentLoaded', function() {
                    applyProfessionalUI();
                    hideAdminSidebarItems();
                  });
                </script><style>
                  @font-face {
                    font-family: 'KelsonSans';
                    src: url('http://shop.mvshoecare.com/fonts/KelsonSans-Regular.otf') format('opentype');
                    font-weight: normal;
                    font-style: normal;
                  }

                  @font-face {
                    font-family: 'KelsonSans';
                    src: url('http://shop.mvshoecare.com/fonts/KelsonSans-Bold.otf') format('opentype');
                    font-weight: bold;
                    font-style: normal;
                  }

                  :root {
                    --bg-ui-bg-base: #ffffff !important;
                    --bg-ui-bg-subtle: #f8fafc !important;
                    --text-ui-fg-base: #1e293b !important;
                    --border-ui-border-base: #e2e8f0 !important;
                  }
                  
                  body, html, * {
                    font-family: 'KelsonSans', sans-serif !important;
                    font-size: 14.5px !important;
                    background-color: #f8fafc !important;
                  }

                  /* LOGIN LOGO FIX */
                  div[class*="bg-ui-button-neutral"][class*="h-[50px]"] svg { display: none !important; }
                  div[class*="bg-ui-button-neutral"][class*="h-[50px]"]::after { display: none !important; }
                  
                  /* SIDEBAR REFACTOR */
                  [data-sidebar] {
                    background-color: #ffffff !important;
                    border-right: 1px solid #f1f5f9 !important;
                  }

                  [data-sidebar-item] {
                    height: 44px !important;
                    margin: 4px 12px !important;
                    border-radius: 8px !important;
                  }
                  
                  [data-sidebar-item] p, 
                  [data-sidebar-item] span,
                  .txt-compact-small {
                    font-size: 15px !important;
                    font-weight: 500 !important;
                    color: #475569 !important;
                  }
                  
                  /* Soft Dividers in Sidebar */
                  [data-sidebar-item]:has(p:contains("Products")),
                  [data-sidebar-item]:has(p:contains("Inventory")),
                  [data-sidebar-item]:has(p:contains("Price Lists")) {
                    border-bottom: 1px solid #f1f5f9 !important;
                    margin-bottom: 12px !important;
                    padding-bottom: 12px !important;
                  }

                  /* REFINED BORDERS (Gray) */
                  div[class*="shadow-elevation-card"],
                  div[class*="rounded-lg"],
                  .border {
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
                    border-radius: 12px !important;
                  }
                  
                  /* Content Gaps and Sections */
                  div[class*="gap-y-"], div[class*="gap-x-"] {
                    gap: 1.25rem !important;
                  }
                  
                  div[class*="p-4"], div[class*="p-6"], div[class*="p-8"] {
                    padding: 1.25rem !important;
                  }
                  
                  /* Table refinement */
                  th {
                    background-color: #f8fafc !important;
                    font-size: 13px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.025em !important;
                  }

                  /* Button Refinement */
                  button[class*="bg-ui-button-inverted"], 
                  button[type="submit"] {
                    background-color: #0f172a !important;
                    border-radius: 8px !important;
                    height: 40px !important;
                  }

                  /* FocusModal background transparency */
                  div[role="dialog"],
                  div.fixed.inset-0.bg-ui-bg-base {
                    background-color: rgba(255, 255, 255, 0.4) !important;
                    backdrop-filter: blur(2px) !important;
                  }

                  /* Hide the Developer Header and items by structural patterns */
                  li:has(a[href*="api-keys"]),
                  li:has(a[href*="workflows"]),
                  [data-sidebar-item]:has(a[href*="api-keys"]),
                  [data-sidebar-item]:has(a[href*="workflows"]),
                  nav:has(a[href*="api-keys"]),
                  nav:has(a[href*="workflows"]),
                  /* Profile Dropdown Hiding */
                  a[role="menuitem"][href*="docs.medusajs.com"],
                  a[role="menuitem"][href*="medusajs.com/changelog"],
                  div[role="menuitem"]:has(a[href*="docs.medusajs.com"]),
                  div[role="menuitem"]:has(a[href*="changelog"]),
                  [data-radix-collection-item]:has(a[href*="docs.medusajs.com"]),
                  [data-radix-collection-item]:has(a[href*="changelog"]) {
                    display: none !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                  }
                </style></body>`
              )
            }
          }
        ],
        server: {
          host: '0.0.0.0',
          allowedHosts: [
            'localhost',
            '.localhost',
            '127.0.0.1',
            'backend',
            'shop.mvshoecare.com',
          ],
          hmr: {
            port: 5173,
            clientPort: 5173,
          },
        },
      }
    },
  },
})

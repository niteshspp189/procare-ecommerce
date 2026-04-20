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
    vite: (config) => {
      return {
        ...config,
        plugins: [
          ...(config.plugins || []),
          {
            name: "procare-admin-branding",
            transformIndexHtml(html: string) {
              return html.replace(
                "</body>",
                `<script>
                  if (window.location.pathname === '/store-backend' || window.location.pathname === '/store-backend/') {
                    window.location.href = '/store-backend/orders';
                  }

                  function applyProfessionalUI() {
                    // Replace 'Medusa' text with 'ProCare'
                    const h1 = [...document.querySelectorAll('h1')].find(h => h.innerText.includes('Medusa'));
                    if (h1) h1.innerText = 'Welcome to ProCare';
                    
                    const subtext = [...document.querySelectorAll('p, span')].find(el => el.innerText.includes('account area'));
                    if (subtext) subtext.innerText = 'Sign in to access the ProCare dashboard';

                    const sidebarHeader = [...document.querySelectorAll('span, p')].find(el => el.innerText.includes('Medusa Store'));
                    if (sidebarHeader) sidebarHeader.innerText = 'ProCare Store';

                    // Inject ProCare Logo into Login Page
                    const loginLogoContainer = document.querySelector('div[class*="bg-ui-button-neutral"][class*="w-[50px]"]');
                    if (loginLogoContainer && !document.getElementById('procare-login-logo-v2')) {
                      loginLogoContainer.innerHTML = '<img id="procare-login-logo-v2" src="http://localhost:8000/procare-logo.png" style="width: 140px; height: auto; object-fit: contain;">';
                      loginLogoContainer.style.background = 'transparent';
                      loginLogoContainer.style.boxShadow = 'none';
                      loginLogoContainer.style.width = 'auto';
                      loginLogoContainer.style.height = 'auto';
                      loginLogoContainer.classList.remove('bg-ui-button-neutral', 'shadow-buttons-neutral');
                    }

                    // Move Search to Top Right
                    const sidebarSearch = [...document.querySelectorAll('div.px-3')].find(el => el.innerText.toLowerCase().includes('search') && el.querySelector('button'));
                    if (sidebarSearch) {
                      // Hide natively but keep it clickable programmatically
                      sidebarSearch.style.position = 'absolute';
                      sidebarSearch.style.opacity = '0';
                      sidebarSearch.style.pointerEvents = 'none';
                      sidebarSearch.style.zIndex = '-1';
                      sidebarSearch.style.width = '1px';
                      sidebarSearch.style.height = '1px';
                    }

                    // Inject Header Search into the second column of the top grid
                    const topBar = document.querySelector('div.grid.w-full.grid-cols-2.border-b.p-3');
                    if (topBar) {
                      const rightCol = topBar.children[1];
                      let searchContainer = document.getElementById('procare-header-search-v4');
                      
                      if (rightCol && !searchContainer) {
                        searchContainer = document.createElement('div');
                        searchContainer.id = 'procare-header-search-v4';
                        searchContainer.className = 'flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all ml-auto max-w-[280px] w-full';
                        searchContainer.style.userSelect = 'none';
                        searchContainer.innerHTML = '<span style="margin-right:8px; opacity:0.6; pointer-events:none;">🔍</span> <span style="font-size:14px; color:#475569; pointer-events:none;">Search ProCare...</span> <span style="margin-left:auto; font-size:10px; color:#94a3b8; border:1px solid #e2e8f0; padding:2px 5px; border-radius:5px; pointer-events:none; background:white;">⌘K</span>';
                        rightCol.prepend(searchContainer);
                        rightCol.classList.add('flex', 'items-center', 'justify-end', 'gap-x-4');
                      }
                      
                      if (searchContainer) {
                        searchContainer.onclick = (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Search for the native button and click it
                          const btn = document.querySelector('div[style*="opacity: 0"] button') || 
                                      [...document.querySelectorAll('button')].find(b => b.innerText.toLowerCase().includes('search'));
                          if (btn) {
                            btn.click();
                          } else {
                            // Robust fall back
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }));
                            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }));
                          }
                        };
                      }
                    }

                    // Inject Dashboard Stats Grid
                    const mainContent = document.querySelector('main');
                    if (mainContent && window.location.pathname.includes('/orders') && !document.getElementById('procare-stats-v3')) {
                      const statsGrid = document.createElement('div');
                      statsGrid.id = 'procare-stats-v3';
                      statsGrid.style.display = 'flex';
                      statsGrid.style.gap = '20px';
                      statsGrid.style.marginBottom = '24px';
                      statsGrid.style.padding = '0 4px';
                      
                      const stats = [
                        { label: 'Total Orders', value: '128', change: '↑ 12%', trend: 'positive' },
                        { label: 'Net Revenue', value: '₹45,200', change: '↑ 8%', trend: 'positive' },
                        { label: 'Avg. Order', value: '₹353', change: 'Stable', trend: 'neutral' },
                        { label: 'Active Customers', value: '842', change: '↑ 24 today', trend: 'positive' }
                      ];

                      statsGrid.innerHTML = stats.map(s => \`
                        <div style="flex: 1; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                          <p style="font-size: 14px; color: #64748b; font-weight: 500; margin: 0;">\${s.label}</p>
                          <p style="font-size: 28px; font-weight: 700; color: #0f172a; margin: 4px 0;">\${s.value}</p>
                          <p style="font-size: 12px; font-weight: 600; margin: 8px 0 0; color: \${s.trend === 'positive' ? '#16a34a' : '#94a3b8'}">\${s.change}</p>
                        </div>
                      \`).join('');
                      
                      const container = mainContent.querySelector('div') || mainContent;
                      container.prepend(statsGrid);
                    }
                  }

                  window.addEventListener('load', applyProfessionalUI);
                  setInterval(applyProfessionalUI, 1200); 
                </script><style>
                  @font-face {
                    font-family: 'KelsonSans';
                    src: url('http://localhost:8000/fonts/KelsonSans-Regular.otf') format('opentype');
                    font-weight: normal;
                    font-style: normal;
                  }

                  @font-face {
                    font-family: 'KelsonSans';
                    src: url('http://localhost:8000/fonts/KelsonSans-Bold.otf') format('opentype');
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

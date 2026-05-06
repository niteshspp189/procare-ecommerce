import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions:
      process.env.DATABASE_URL?.includes('ssl')
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : { ssl: false },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/razorpay",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_ID,
              key_secret: process.env.RAZORPAY_SECRET,
              razorpay_account: process.env.RAZORPAY_ACCOUNT,
            },
          },
          {
            resolve: "@medusajs/medusa/payment-manual",
            id: "manual",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: "http://localhost:9000/static"
            },
          },
        ],
      },
    },
  ],
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

                  // ProCare Admin UI Refinement v3.0
                  function applyBranding() {
                    var h1s = document.querySelectorAll('h1');
                    for (var i = 0; i < h1s.length; i++) {
                      if (h1s[i].innerText.includes('Medusa')) h1s[i].innerText = 'ProCare Dashboard';
                    }
                    
                    var loginLogoContainer = document.querySelector('div[class*="bg-ui-button-neutral"][class*="w-[50px]"]');
                    if (loginLogoContainer && !document.getElementById('procare-login-logo-v3')) {
                      loginLogoContainer.innerHTML = '<img id="procare-login-logo-v3" src="/procare-logo.png" style="width: 140px; height: auto; object-fit: contain;">';
                      loginLogoContainer.style.background = 'transparent';
                      loginLogoContainer.style.boxShadow = 'none';
                      loginLogoContainer.style.width = 'auto';
                      loginLogoContainer.style.height = 'auto';
                    }
                  }

                  function hideDevTools() {
                    var targets = ['Developer', 'Publishable API Keys', 'Secret API Keys', 'Workflows', 'Documentation', 'Changelog'];
                    document.querySelectorAll('p, span, a').forEach(function(el) {
                      var text = (el.textContent || '').trim();
                      if (targets.indexOf(text) !== -1) {
                        var container = el.closest('li') || el.closest('[data-sidebar-item]') || el;
                        if (container) container.style.setProperty('display', 'none', 'important');
                      }
                    });
                  }

                  setInterval(applyBranding, 1000);
                  setInterval(hideDevTools, 500);
                </script><style>
                  :root {
                    --bg-ui-bg-base: #ffffff !important;
                    --bg-ui-bg-subtle: #f8fafc !important;
                    --text-ui-fg-base: #1e293b !important;
                    --border-ui-border-base: #e2e8f0 !important;
                  }
                  
                  body, html, * {
                    font-family: 'Inter', -apple-system, sans-serif !important;
                  }

                  [data-sidebar] {
                    background-color: #ffffff !important;
                    border-right: 1px solid #f1f5f9 !important;
                  }

                  [data-sidebar-item] {
                    height: 40px !important;
                    margin: 2px 12px !important;
                    border-radius: 6px !important;
                  }
                  
                  [data-sidebar-item] p, [data-sidebar-item] span {
                    font-size: 14px !important;
                    font-weight: 500 !important;
                  }
                  
                  .border, div[class*="shadow-elevation-card"] {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.03) !important;
                  }
                  
                  button[class*="bg-ui-button-inverted"] {
                    background-color: #0f172a !important;
                    border-radius: 8px !important;
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

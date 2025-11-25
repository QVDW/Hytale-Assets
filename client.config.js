/**
 * CLIENT CONFIGURATION FILE
 * 
 * This file contains all the customizable settings for your client template.
 * Modify these values to match your client's branding and requirements.
 * 
 * After making changes, run: npm run setup-client
 */

const clientConfig = {
  // ===================================
  // SITE METADATA
  // ===================================
  site: {
    name: "Template",
    description: "Template beschrijving",
    keywords: ["keyword1", "keyword2", "keyword3"],
    author: "Template Author",
    language: "nl", // or "nl" for Dutch
    currency: "EUR", // or "EUR"
  },

  // ===================================
  // BRANDING & LOGO
  // ===================================
  branding: {
    // Logo settings
    logo: {
      // Path to your logo file (place in /public folder)
      src: "/placeholder.png", // Change this to your logo
      alt: "Placeholder Logo",
      width: 150,
      height: 50,
    },
    // Favicon settings (place favicon files in /public folder)
    favicon: {
      ico: "/favicon.ico",
      png: "/favicon.png",
      apple: "/apple-touch-icon.png",
      android192: "/android-chrome-192x192.png",
      android512: "/android-chrome-512x512.png",
    },
  },

  // ===================================
  // DEFAULT THEME COLORS
  // ===================================
  theme: {
    colors: {
      primary: "#4692c1",    // Main brand color
      secondary: "#94c4e3",  // Secondary brand color
      accent: "#5cacde",     // Accent color for highlights
      text: "#0c1419",       // Main text color
      background: "#f8fafc", // Background color
    },
  },

  // ===================================
  // NAVIGATION MENU
  // ===================================
  navigation: {
    // Main navigation items (uncomment and customize as needed)
    menuItems: [
      // { name: "Home", href: "/", external: false },
      // { name: "About", href: "/about", external: false },
      // { name: "Services", href: "/services", external: false },
      // { name: "Contact", href: "/contact", external: false },
      // { name: "FAQ", href: "/faq", external: false },
    ],
    // Mobile menu items (can be different from desktop)
    mobileMenuItems: [
      { name: "Home", href: "/", external: false },
      // { name: "FAQ", href: "/faq", external: false },
    ],
  },

  // ===================================
  // DEFAULT CONTACT INFORMATION
  // ===================================
  contact: {
    name: "Template Contact Name",
    address: "123 Template Street, Template City, Template Country",
    phone: "+1 (555) 123-4567",
    email: "info@template.com",
    website: "https://template.com",
  },

  // ===================================
  // SOCIAL MEDIA LINKS
  // ===================================
  socialMedia: {
    facebook: "", // e.g., "https://facebook.com/yourcompany"
    instagram: "", // e.g., "https://instagram.com/yourcompany"
    twitter: "", // e.g., "https://twitter.com/yourcompany"
    linkedin: "", // e.g., "https://linkedin.com/company/yourcompany"
    youtube: "", // e.g., "https://youtube.com/c/yourcompany"
  },

  // ===================================
  // DEFAULT FOOTER CONTENT
  // ===================================
  footer: {
    backgroundColor: "#202020",
    textColor: "#fefefe",
    columns: [
      {
        title: "Company",
        items: [
          { text: "About Us", link: "/about", isExternal: false },
          { text: "Our Services", link: "/services", isExternal: false },
          { text: "Contact", link: "/contact", isExternal: false },
        ]
      },
      {
        title: "Support",
        items: [
          { text: "FAQ", link: "/faq", isExternal: false },
          { text: "Help Center", link: "/help", isExternal: false },
          { text: "Contact Support", link: "/contact", isExternal: false },
        ]
      },
      {
        title: "Legal",
        items: [
          { text: "Legal Disclaimer", link: "/legal/disclaimer", isExternal: false },
          { text: "Privacy Policy", link: "/legal/privacy", isExternal: false },
        ]
      },
      {
        title: "Connect",
        items: [
          { text: "Newsletter", link: "/newsletter", isExternal: false },
          { text: "Blog", link: "/blog", isExternal: false },
          { text: "News", link: "/news", isExternal: false },
        ]
      }
    ]
  },

  // ===================================
  // DEFAULT LEGAL CONTENT
  // ===================================
  legal: {
    disclaimer: `
This website and its content are provided for informational purposes only. 
The information contained on this website does not constitute professional advice.

While we strive to keep the information up to date and correct, we make no 
representations or warranties of any kind, express or implied, about the 
completeness, accuracy, reliability, suitability or availability with respect 
to the website or the information, products, services, or related graphics 
contained on the website for any purpose.

Any reliance you place on such information is therefore strictly at your own risk.
    `.trim(),
    
    privacyPolicy: `
We respect your privacy and are committed to protecting your personal data.

Information We Collect:
- Personal information you provide when contacting us
- Usage data to improve our services
- Cookies for website functionality

How We Use Your Information:
- To respond to your inquiries
- To improve our website and services
- To comply with legal obligations

We do not sell, trade, or rent your personal information to third parties.

For questions about this privacy policy, please contact us at: info@yourcompany.com
    `.trim(),
  },

  // ===================================
  // ADMIN INTERFACE SETTINGS
  // ===================================
  admin: {
    // Language for admin interface
    language: "nl", // "en" for English, "nl" for Dutch
    // Admin dashboard title
    dashboardTitle: "Admin Dashboard",
    // Items per page in admin lists
    itemsPerPage: 10,
  },

  // ===================================
  // FEATURES CONFIGURATION
  // ===================================
  features: {
    // Enable/disable various features
    enableFAQ: true,
    enableItems: false, // Set to true if you want the items/catalog feature
    enableContactForm: true,
    enableNewsletter: false,
    enableBlog: false,
  },

  // ===================================
  // COOKIES CONFIGURATION
  // ===================================
  cookies: {
    // Cookie banner configuration
    banner: {
      title: "Wij gebruiken cookies",
      description: "Wij gebruiken cookies om uw ervaring op onze website te verbeteren. Sommige cookies zijn noodzakelijk voor het functioneren van de website, terwijl andere ons helpen de website te verbeteren en u persoonlijke content te bieden.",
      acceptAllText: "Alles accepteren",
      declineAllText: "Alles weigeren",
      customizeText: "Aanpassen",
      saveText: "Opslaan",
      necessaryOnlyText: "Alleen noodzakelijke",
    },
    // Cookie categories
    categories: {
      necessary: {
        name: "Noodzakelijke en functionele cookies",
        description: "Deze cookies zijn essentieel voor het functioneren van de website en maken extra functies mogelijk zoals embedded content. Ze kunnen niet worden uitgeschakeld.",
        required: true,
        cookies: [
          {
            name: "Sessie cookies",
            description: "Noodzakelijk voor het bijhouden van uw sessie",
            duration: "Tot einde van de sessie"
          },
          {
            name: "Voorkeuren cookies",
            description: "Slaat uw cookie voorkeuren op",
            duration: "1 jaar"
          },
          {
            name: "Embedded content",
            description: "Maakt embedded content zoals video's en kaarten mogelijk",
            duration: "1 jaar"
          },
          {
            name: "Website functionaliteit",
            description: "Cookies voor chat widgets en andere interactieve elementen",
            duration: "1 jaar"
          }
        ]
      },
      analytics: {
        name: "Analytische cookies",
        description: "Deze cookies helpen ons begrijpen hoe bezoekers de website gebruiken door anonieme informatie te verzamelen.",
        required: false,
        enabled: false,
        cookies: [
          {
            name: "Google Analytics",
            description: "Verzamelt anonieme statistieken over website gebruik",
            duration: "2 jaar"
          }
        ]
      },
      marketing: {
        name: "Marketing cookies",
        description: "Deze cookies worden gebruikt om advertenties te personaliseren en de effectiviteit van advertentiecampagnes te meten.",
        required: false,
        enabled: false,
        cookies: [
          {
            name: "Advertising cookies",
            description: "Gebruikt voor gerichte advertenties",
            duration: "1 jaar"
          }
        ]
      }
    },
    // Cookie policy page
    policyPage: {
      title: "Cookie beleid",
      lastUpdated: "Laatst bijgewerkt: " + new Date().toLocaleDateString('nl-NL'),
      content: `
<h2>Wat zijn cookies?</h2>
<p>Cookies zijn kleine tekstbestanden die op uw computer of mobiele apparaat worden opgeslagen wanneer u onze website bezoekt. Ze helpen ons de website te laten functioneren en uw ervaring te verbeteren.</p>

<h2>Welke cookies gebruiken wij?</h2>
<p>Wij gebruiken verschillende soorten cookies voor verschillende doeleinden:</p>

<h3>Noodzakelijke cookies</h3>
<p>Deze cookies zijn essentieel voor het functioneren van onze website. Zonder deze cookies kan de website niet goed werken.</p>

<h3>Analytische cookies</h3>
<p>Deze cookies helpen ons begrijpen hoe bezoekers onze website gebruiken, zodat we deze kunnen verbeteren.</p>

<h3>Marketing cookies</h3>
<p>Deze cookies worden gebruikt om advertenties te personaliseren en de effectiviteit van onze marketingcampagnes te meten.</p>

<h3>Functionele cookies</h3>
<p>Deze cookies maken extra functies mogelijk zoals embedded video's en interactieve kaarten.</p>

<h2>Uw rechten</h2>
<p>U heeft het recht om uw cookie-voorkeuren op elk moment aan te passen. U kunt dit doen via de cookie-instellingen op onze website.</p>

<h2>Contact</h2>
<p>Voor vragen over ons cookie beleid kunt u contact met ons opnemen via info@yourcompany.com</p>
      `.trim()
    }
  },
};

module.exports = clientConfig; 
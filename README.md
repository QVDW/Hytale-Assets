# Client Template - Easy Website Customization

This is a customizable website template built with [Next.js](https://nextjs.org) that allows easy branding and content customization for new clients through configuration files.

## 🚀 Quick Setup for New Clients

### 1. Environment Setup

Copy the environment template and fill in your values:

```bash
cp env.example .env
```

Edit the `.env` file with your specific settings:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for authentication
- `NEXT_PUBLIC_SITE_NAME`: Your company name
- `NEXT_PUBLIC_API_URL`: Your site URL (for development: http://localhost:3000)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Initial admin credentials
- `EMAIL_*`: Email configuration for contact forms (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_RECIPIENT - all required if using contact forms)

### 2. Client Configuration

Edit `client.config.js` to customize your site:

```javascript
const clientConfig = {
  site: {
    name: "Your Company Name",
    description: "Your company description",
    // ... more settings
  },
  branding: {
    logo: {
      src: "/your-logo.png", // Place your logo in /public folder
      alt: "Your Company Logo",
      // ... size settings
    },
    // ... favicon settings
  },
  theme: {
    colors: {
      primary: "#your-brand-color",
      // ... other colors
    },
  },
  // ... contact info, social media, footer content, etc.
};
```

### 3. Add Your Branding Assets

Replace these files in the `/public` folder:
- `your-logo.png` (update path in client.config.js)
- `favicon.ico`
- `favicon.png` 
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

### 4. Initialize Your Site

Run the setup script to configure your database and apply your customizations:

```bash
npm install
npm run setup-client
```

This script will:
- ✅ Apply your color theme
- ✅ Create your admin user
- ✅ Set up footer with your contact information
- ✅ Configure legal pages with your content
- ✅ Validate email configuration (if provided)

### 5. Start Development

```bash
npm run dev
```

Your customized site will be available at `http://localhost:3000`

## 📋 What Can Be Customized

### Site Metadata
- Site title and description
- Keywords and author information
- Language settings

### Branding
- Logo and favicon files
- Company colors and theme
- Brand-specific styling

### Content
- Navigation menu items
- Footer content and links
- Contact information
- Social media links
- Legal disclaimer and privacy policy

### Features
- Enable/disable FAQ system
- Enable/disable item catalog
- Enable/disable contact forms
- Admin interface language

## 🎛️ Admin Panel

Access the admin panel at `/adm/login` using the credentials you set in your `.env` file.

From the admin panel you can:
- Manage users
- Update site colors in real-time
- Customize footer content
- Edit legal pages
- Manage FAQ entries
- Configure additional settings

## 🔧 Advanced Customization

### Updating Site Content After Setup

You can always re-run the setup script to apply new changes from your configuration:

```bash
npm run setup-client
```

### Manual Customization

For more advanced customization beyond the configuration file:
- Edit React components in `/components`
- Modify styles in `/src/styles`
- Customize API routes in `/src/app/api`
- Update database models in `/models`

### Database Management

The template uses MongoDB with Mongoose. Schema definitions are in the `/models` folder.

## 📚 Project Structure

```
├── client.config.js          # Main client configuration
├── env.example               # Environment variables template
├── scripts/setup-client.js   # Automated setup script
├── components/               # React components
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── styles/              # SCSS stylesheets
│   └── utils/               # Utility functions
├── models/                  # Database schemas
├── libs/                    # Database connection
└── public/                  # Static assets (logos, favicons)
```

## 🚢 Deployment

### Environment Variables for Production

Ensure these are set in your production environment:
- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SITE_URL`

### Deploy on Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

The template works on any Node.js hosting platform:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS
- Google Cloud Platform

## 🆘 Support

### Common Issues

**Setup script fails:**
- Ensure `.env` file is properly configured
- Check MongoDB connection string
- Verify all required environment variables are set

**Logo not showing:**
- Ensure logo file is in `/public` folder
- Update `client.config.js` with correct path
- Check file permissions

**Admin login not working:**
- Verify admin credentials in `.env` file
- Ensure setup script ran successfully
- Check database connection

**Contact form not working:**
- Ensure all EMAIL_ variables are set (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_RECIPIENT)
- Use EMAIL_ prefix, not SMTP_ prefix
- For Gmail, use app-specific passwords, not regular passwords

### Getting Help

1. Check the configuration in `client.config.js`
2. Verify environment variables in `.env`
3. Review setup script output for errors
4. Check browser console for JavaScript errors

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)

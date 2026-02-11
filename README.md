# CenterPoint Energy Chat Interface

A modern, responsive chat application built with **Next.js (App Router)** and **Tailwind CSS**, designed for deployment on AWS Amplify.

## Features

✨ **Modern UI Design**
- Full-screen responsive chat interface
- Fixed header with branding
- Scrollable message area with auto-scroll to bottom
- Fixed input area with text field and send button
- Gray/blue color scheme for professional appearance

🚀 **React & Next.js**
- Built with Next.js 15+ using App Router
- React hooks for state management (useState, useRef, useEffect)
- Client-side component with "use client" directive
- Server-side rendering ready

🎨 **Styling**
- Pure Tailwind CSS (no external UI libraries)
- Fully responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Accessible form elements

💬 **Chat Functionality**
- Real-time message history
- User and bot message differentiation
- Auto-scroll to latest message
- Loading state with animated indicator
- Error handling and display
- Timestamp for each message

🔌 **API Integration**
- POST requests to AWS Lambda endpoint
- Configurable via environment variables
- Proper error handling
- Response extraction from Lambda payload

## Project Structure

```
.
├── app/
│   ├── globals.css          # Global Tailwind styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main chat page component
├── public/                  # Static assets (create as needed)
├── .env.local              # Environment variables
├── .gitignore              # Git ignore rules
├── amplify.yml             # AWS Amplify deployment config
├── next.config.js          # Next.js configuration
├── package.json            # Project dependencies
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   The `.env.local` file is already set up with the Lambda URL:
   ```
   NEXT_PUBLIC_LAMBDA_URL=https://grafqfo63yvndhsjgmi2f2cz2m0wewkz.lambda-url.eu-west-1.on.aws/
   ```

   If you need to change this, update the `.env.local` file.

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page will auto-refresh as you edit files.

## Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Deployment to AWS Amplify

### Prerequisites
- An AWS account
- A GitHub repository with this code
- AWS Amplify CLI (optional but recommended)

### Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit: CenterPoint chat interface"
   git push origin main
   ```

2. **Connect to AWS Amplify**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Click "New app" → "Host web app"
   - Select your GitHub repository and branch
   - Install the GitHub app if prompted

3. **Configure build settings**
   - Amplify will auto-detect Next.js and use the `amplify.yml` configuration
   - Set environment variables in Amplify Console:
     - Name: `NEXT_PUBLIC_LAMBDA_URL`
     - Value: `https://grafqfo63yvndhsjgmi2f2cz2m0wewkz.lambda-url.eu-west-1.on.aws/`

4. **Deploy**
   - Review the build settings
   - Click "Save and deploy"
   - Amplify will build and deploy your app automatically

### Troubleshooting Amplify Deployment

If the build fails:
1. Check the build logs in the Amplify Console
2. Ensure Node.js version is 18+ (set in Amplify environment variables if needed)
3. Verify environment variables are set correctly
4. Clear cache and redeploy

## API Integration

### Endpoint
- **URL**: AWS Lambda URL (configured in `.env.local`)
- **Method**: POST
- **Content-Type**: application/json

### Request Payload
```json
{
  "message": "User input here",
  "customer_name": "CenterPoint"
}
```

### Response Expected
The Lambda should return a JSON object. The app will extract the response from either:
- `data.response` (preferred)
- `data.body` (fallback)

Example response:
```json
{
  "response": "Here's the information you requested..."
}
```

### Error Handling
- Network errors are caught and displayed in the chat
- API errors show status codes
- Missing Lambda URL warns the user
- All errors are logged to the message history for visibility

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
extend: {
  colors: {
    primary: '#1e40af',     // Blue
    secondary: '#6b7280',   // Gray
  },
},
```

### Messages
Edit the initial bot message in `app/page.tsx`:
```typescript
{
  role: 'bot',
  content: 'Hello! 👋 Welcome to CenterPoint Energy Assistant. How can I help you today?',
}
```

### Styling
All styling is done with Tailwind CSS classes. Edit the className attributes in `app/page.tsx` to customize the appearance.

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Dependencies

- **Next.js 15.1+**: React framework with App Router
- **React 18.3+**: UI library
- **Tailwind CSS 3.4+**: Utility-first CSS framework
- **TypeScript 5.6+**: Type safety
- **PostCSS & Autoprefixer**: CSS processing

## License

MIT

---

**For support or issues**, please create an issue in the repository.

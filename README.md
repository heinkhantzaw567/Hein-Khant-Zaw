# Next.js Supabase Auth Starter

A complete authentication starter template using Next.js, Supabase Authentication, and Tailwind CSS.

## Features

- User authentication with Supabase
- Email/Password authentication
- Responsive UI with Tailwind CSS
- Protected routes
- Sign up and sign in pages
- Dashboard example
- Real-time authentication state management
- User metadata support (full name)

## Prerequisites

- Node.js 14+ and npm
- Supabase project

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a new Supabase project:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Wait for the database to be ready
   - Go to Project Settings > API
   - Copy your project URL and anon/public key

4. Create a `.env.local` file in the root directory with your Supabase configuration:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Replace the values with your Supabase project URL and anon key.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/pages` - Next.js pages including API routes
- `/pages/api/auth` - NextAuth.js authentication API routes
- `/lib` - Utility functions and database configuration
- `/styles` - Global styles and Tailwind CSS configuration

## Contributing

Feel free to submit issues and enhancement requests!

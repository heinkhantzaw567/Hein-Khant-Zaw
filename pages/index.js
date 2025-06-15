import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12 sm:px-6 md:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md md:max-w-lg">
        <h1 className="text-center text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
          Welcome to Hein Khant Zaw
        </h1>
        <p className="mt-2 sm:mt-3 text-center text-sm sm:text-base md:text-lg text-gray-600 max-w-[280px] sm:max-w-none mx-auto">
          Manage your account and explore features.
        </p>
      </div>

      <div className="mt-8 sm:mt-10 mx-auto w-full max-w-[320px] sm:max-w-[380px] md:max-w-[448px]">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-6 md:px-8 shadow sm:rounded-lg">
          <div className="space-y-4 sm:space-y-6">
            {!user ? (
              <>
                <div>
                  <Link
                    href="/login"
                    className="w-full flex justify-center py-3 sm:py-3.5 md:py-4 px-4 border border-transparent rounded-md shadow-sm text-base sm:text-base md:text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign in
                  </Link>
                </div>
                <div>
                  <Link
                    href="/signup"
                    className="w-full flex justify-center py-3 sm:py-3.5 md:py-4 px-4 border border-gray-300 rounded-md shadow-sm text-base sm:text-base md:text-lg font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create an account
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-3 sm:py-3.5 md:py-4 px-4 border border-transparent rounded-md shadow-sm text-base sm:text-base md:text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

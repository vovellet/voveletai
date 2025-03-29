import Link from 'next/link';

export default function Home() {
  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Contribute, Earn, and Engage with{' '}
            <span className="text-primary-600 dark:text-primary-400">ObscuraNet</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            An AI-powered contribution and tokenization system that rewards valuable insights
          </p>
          <div className="space-x-4">
            <Link href="/contribute" className="btn-primary text-lg py-3 px-8">
              Contribute with GPT
            </Link>
            <Link href="/about" className="btn-secondary text-lg py-3 px-8">
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
              <div className="bg-primary-100 dark:bg-primary-900 w-12 h-12 flex items-center justify-center rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-600 dark:text-primary-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. Contribute</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your insights, ideas, and knowledge through our AI-powered contribution system.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
              <div className="bg-primary-100 dark:bg-primary-900 w-12 h-12 flex items-center justify-center rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-600 dark:text-primary-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">2. Earn Tokens</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive tokens based on the quality, uniqueness, and relevance of your contributions.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
              <div className="bg-primary-100 dark:bg-primary-900 w-12 h-12 flex items-center justify-center rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-600 dark:text-primary-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">3. Utilize Blockchain</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your tokens are securely stored on the blockchain, allowing for transparent and immutable verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
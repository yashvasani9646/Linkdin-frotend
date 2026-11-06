import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page Component
 * Displayed when user navigates to a non-existent route
 */
const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
                <p className="text-lg text-gray-600 mb-8">
                    Sorry, the page you're looking for doesn't exist.
                </p>
                <Link
                    to="/"
                    className="px-8 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-700 transition shadow-md hover:shadow-lg inline-block"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;


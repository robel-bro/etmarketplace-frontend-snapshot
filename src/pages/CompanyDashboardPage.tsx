import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const CompanyDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Company Dashboard</h1>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-8">
        <p className="text-gray-600">Welcome back, {user?.companyName || 'Company User'}.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/company/bulk-order" className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
          <h2 className="text-2xl font-bold text-primary-600 mb-2">Bulk Order</h2>
          <p className="text-gray-600">Place large orders with custom quantities.</p>
        </Link>
        <Link to="/company/messages" className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
          <h2 className="text-2xl font-bold text-primary-600 mb-2">Messages</h2>
          <p className="text-gray-600">Communicate with suppliers.</p>
        </Link>
        <Link to="/company/suppliers" className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
          <h2 className="text-2xl font-bold text-primary-600 mb-2">Find Suppliers</h2>
          <p className="text-gray-600">Discover and contact business suppliers.</p>
        </Link>
      </div>
    </div>
  );
};

export default CompanyDashboardPage;
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBagIcon, HeartIcon, MagnifyingGlassIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'cart' | 'wishlist' | 'search' | 'order';
  title?: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
}

const iconMap = {
  cart: ShoppingBagIcon,
  wishlist: HeartIcon,
  search: MagnifyingGlassIcon,
  order: ArchiveBoxIcon,
};

const defaultMessages = {
  cart: {
    title: 'Your cart is empty',
    description: 'Looks like you haven\'t added anything to your cart yet.',
    action: 'Start Shopping',
    link: '/products',
  },
  wishlist: {
    title: 'Your wishlist is empty',
    description: 'Save your favorite items here.',
    action: 'Explore Products',
    link: '/products',
  },
  search: {
    title: 'No results found',
    description: 'We couldn\'t find what you\'re looking for. Try different keywords.',
    action: 'Browse All',
    link: '/products',
  },
  order: {
    title: 'No orders yet',
    description: 'You haven\'t placed any orders.',
    action: 'Start Shopping',
    link: '/products',
  },
};

const EmptyState = ({
  type,
  title,
  description,
  actionText,
  actionLink,
}: EmptyStateProps) => {
  const Icon = iconMap[type];
  const defaults = defaultMessages[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-32 h-32 mb-6 text-brand-200">
        <Icon className="w-full h-full" />
      </div>
      <h2 className="text-2xl font-bold text-stone-800 mb-2">
        {title || defaults.title}
      </h2>
      <p className="text-stone-600 mb-8 max-w-md">
        {description || defaults.description}
      </p>
      {(actionText || defaults.action) && (
        <Button variant="default" size="lg" asChild>
          <Link to={actionLink || defaults.link}>
            {actionText || defaults.action}
          </Link>
        </Button>
      )}
    </motion.div>
  );
};

export default EmptyState;
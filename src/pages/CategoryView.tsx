import { useParams } from 'react-router-dom';
import AllProductsPage from './AllProductsPage';

const CategoryView = () => {
  const { tab } = useParams<{ tab: string }>();

  // Map URL tab to the internal tab type
  const mapTab = (tabParam: string) => {
    switch (tabParam) {
      case 'new-arrivals': return 'new-arrivals';
      case 'best-sellers':  return 'popular';
      case 'trending':      return 'trending';
      case 'flash-sales':   return 'sale';
      case 'super-deals':   return 'super-deals';
      case 'packages':      return 'packages';
      default:              return 'new-arrivals';
    }
  };

  return <AllProductsPage activeTab={mapTab(tab)} />;
};

export default CategoryView;
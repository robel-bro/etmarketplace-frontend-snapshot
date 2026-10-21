import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface FeaturesProps {
  features: string[];
}

const Features = ({ features }: FeaturesProps) => {
  if (!features || features.length === 0) {
    return <p className="text-gray-500">No features listed.</p>;
  }

  return (
    <ul className="space-y-2">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>
  );
};

export default Features;
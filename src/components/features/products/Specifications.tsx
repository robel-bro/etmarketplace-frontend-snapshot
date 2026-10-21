interface SpecificationsProps {
  specs: Record<string, string>;
}

const Specifications = ({ specs }: SpecificationsProps) => {
  if (!specs || Object.keys(specs).length === 0) {
    return <p className="text-gray-500">No specifications available.</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(specs).map(([key, value], idx) => (
            <tr key={key} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="px-4 py-3 font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-gray-600">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Specifications;
import { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HolidayBannerModalProps {
  onClose: () => void;
  onSave: (bannerData: { message: string; media: string | null }) => void;
  initialData?: { message: string; media: string | null };
}

const HolidayBannerModal = ({ onClose, onSave, initialData }: HolidayBannerModalProps) => {
  const [message, setMessage] = useState(initialData?.message || '');
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialData?.media || null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setMediaPreview(result);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({ message, media: mediaPreview });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Holiday Banner</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Banner Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Ethiopian New Year Sale! 50% off"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Image or Video</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          {mediaPreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Preview:</p>
              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="max-h-40 rounded" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="max-h-40 rounded object-cover" />
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Save Banner
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HolidayBannerModal;
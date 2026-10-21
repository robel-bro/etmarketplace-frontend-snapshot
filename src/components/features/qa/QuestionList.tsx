import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import api from '../../../lib/axios';
import { useAuth } from '../../../hooks/useAuth';

const QuestionList = ({ productId }: { productId: number }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  const { data: questions, isLoading } = useQuery(
    ['questions', productId],
    () => api.get(`/questions?product_id=${productId}`).then(res => res.data),
    { enabled: !!productId }
  );

  const mutation = useMutation(
    (question: string) => api.post('/questions', { question: { product_id: productId, question } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions', productId]);
        setNewQuestion('');
        setShowForm(false);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    mutation.mutate(newQuestion);
  };

  if (isLoading) return <div>Loading questions...</div>;

  return (
    <div className="space-y-4">
      {user && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-primary-600 hover:underline font-medium"
        >
          Ask a Question
        </button>
      )}

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmit}
          className="space-y-2 border rounded-lg p-4"
        >
          <textarea
            rows={3}
            placeholder="Type your question here..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={mutation.isLoading} className="bg-primary-600 text-white px-4 py-2 rounded-lg">
              Submit Question
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-3 mt-4">
        {questions?.map((qa: any) => (
          <motion.div
            key={qa.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b pb-2"
          >
            <p className="font-medium">Q: {qa.question}</p>
            {qa.answers?.length > 0 ? (
              qa.answers.map((answer: any) => (
                <p key={answer.id} className="text-gray-700 ml-4">A: {answer.answer}</p>
              ))
            ) : (
              <p className="text-gray-500 ml-4 italic">Not answered yet</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{qa.user?.name} • {new Date(qa.created_at).toLocaleDateString()}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';

const MessagesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Fetch conversations
  const { data: conversations } = useQuery('conversations', () =>
    api.get('/conversations').then(res => res.data)
  );

  // Fetch messages for selected user
  const { data: messages } = useQuery(
    ['messages', selectedUserId],
    () => api.get(`/messages?with=${selectedUserId}`).then(res => res.data),
    { enabled: !!selectedUserId }
  );

  // Send message
  const sendMessage = useMutation(
    (content: string) => api.post('/messages', { message: { receiver_id: selectedUserId, content } }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['messages', selectedUserId]);
        setNewMessage('');
      },
    }
  );

  const handleSend = () => {
    if (!newMessage.trim() || !selectedUserId) return;
    sendMessage.mutate(newMessage);
  };

  if (!user) return <div>Please log in to view messages.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Messages</h1>
      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversation List */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b font-semibold">Conversations</div>
          <div className="overflow-y-auto h-full">
            {conversations?.map((conv: any) => (
              <div
                key={conv.id}
                onClick={() => setSelectedUserId(conv.id)}
                className={`p-4 border-b cursor-pointer hover:bg-white/50 transition ${
                  selectedUserId === conv.id ? 'bg-white/30' : ''
                }`}
              >
                <p className="font-medium">{conv.name}</p>
                <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex flex-col h-full">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b font-semibold">
                {conversations?.find(c => c.id === selectedUserId)?.name}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 rounded-xl text-sm ${
                      msg.sender_id === user.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="bg-primary-600 text-white px-4 py-2 rounded-lg">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
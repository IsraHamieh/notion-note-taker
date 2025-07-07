import React, { useState } from 'react';

const KEY_TYPES = [
  { id: 'anthropic', label: 'Anthropic API Key' },
  { id: 'tavily', label: 'Tavily API Key' },
  { id: 'openai', label: 'OpenAI API Key' },
  // Add more key types as needed
];

const KeysPage: React.FC = () => {
  const [keys, setKeys] = useState<{ [key: string]: string }>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys),
        credentials: 'include',
      });
      if (response.ok) {
        setStatus('Keys saved successfully!');
      } else {
        setStatus('Failed to save keys.');
      }
    } catch (err) {
      setStatus('Error saving keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">API & Integration Keys</h2>
      <form onSubmit={handleSubmit}>
        {KEY_TYPES.map(key => (
          <div className="mb-4" key={key.id}>
            <label htmlFor={key.id} className="block text-sm font-medium text-gray-700">
              {key.label}
            </label>
            <input
              id={key.id}
              name={key.id}
              type="password"
              value={keys[key.id] || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder={`Enter your ${key.label}`}
              autoComplete="off"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Keys'}
        </button>
        {status && <div className="mt-4 text-center text-sm text-gray-700">{status}</div>}
      </form>
    </div>
  );
};

export default KeysPage; 
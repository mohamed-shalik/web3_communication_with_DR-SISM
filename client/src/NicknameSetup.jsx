import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NicknameSetup = () => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('tempAddress')) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    try {
      const address = localStorage.getItem('tempAddress');
      const response = await axios.post('http://localhost:3001/api/register', {
        address,
        nickname,
      });

      localStorage.removeItem('tempAddress');
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white p-8 rounded-lg shadow-2xl w-96 text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-500 text-white rounded-full mb-4"
        >
          <FaUser size={30} />
        </motion.div>

        <h1 className="text-2xl font-bold mb-4 text-gray-800">Choose a Nickname</h1>
        <p className="text-gray-500 mb-6">This will be your identity in the chat</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
          >
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-red-500"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            Continue to Chat
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default NicknameSetup;

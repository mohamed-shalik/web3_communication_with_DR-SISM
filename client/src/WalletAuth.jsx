import { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEthereum } from 'react-icons/fa';

const WalletAuth = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const response = await axios.post('http://localhost:3001/api/auth', { address });
      if (response.data.exists) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/chat');
      } else {
        localStorage.setItem('tempAddress', address);
        navigate('/nickname');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-black flex items-center justify-center px-4">
      <motion.div 
        className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 text-center max-w-md w-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center space-y-4">
          <FaEthereum className="text-5xl text-blue-400 animate-pulse" />
          <h1 className="text-3xl font-bold text-white">Communication begins . . .</h1>
          <p className="text-gray-300 text-sm">Securely sign in using your Ethereum wallet.</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md flex items-center space-x-2 transition duration-300 hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <FaEthereum className="text-xl" />
                <span>Connect with MetaMask</span>
              </>
            )}
          </motion.button>

          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default WalletAuth;

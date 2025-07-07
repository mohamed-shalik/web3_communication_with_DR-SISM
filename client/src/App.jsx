import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WalletAuth from './WalletAuth';
import NicknameSetup from './NicknameSetup';
import ChatPage from './ChatPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WalletAuth />} />
        <Route path="/nickname" element={<NicknameSetup />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
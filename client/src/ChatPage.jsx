import { useState, useEffect } from 'react';
import axios from 'axios';
import { PaperAirplaneIcon, PhotoIcon, ArrowLeftOnRectangleIcon,MicrophoneIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import EncryptedImageMessage from './EncryptedImageMessage';

const ChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [chattedUsers, setChattedUsers] = useState([]); // Users you've chatted with
    const [allUsers, setAllUsers] = useState([]); // All registered users
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchChattedUsers();
        fetchAllUsers();
    }, [navigate]);

    const fetchChattedUsers = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/chats', {
                headers: {
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).address}`
                }
            });
            setChattedUsers(response.data);
            setFilteredUsers(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/users', {
                headers: {
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).address}`
                }
            });
            setAllUsers(response.data);
        } catch (err) {
            console.error(err);
        }
    };
    const handleSearch = (query) => {
        setSearchQuery(query);

        if (query.trim() === "") {
            setFilteredUsers(chattedUsers);
            return;
        }
        const filtered = allUsers.filter(user =>
            user.nickname.toLowerCase().includes(query.toLowerCase()) ||
            user.address.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredUsers(filtered);
    };
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        try {
            await axios.post('http://localhost:3001/api/messages', {
                receiver: selectedUser,
                content: newMessage,
                type: 'text'
            }, {
                headers: {
                    Authorization: `Bearer ${user.address}`
                }
            });
            setNewMessage('');
            fetchMessages();
            fetchChattedUsers();
        } catch (err) {
            console.error(err);
        }
    };
    const sendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedUser) return;
        try {
            const formData = new FormData();
            formData.append('image', file);

            const encryptionResponse = await axios.post(
                'http://localhost:3001/api/encrypt-image',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user.address}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            await axios.post(
                'http://localhost:3001/api/messages',
                {
                    receiver: selectedUser,
                    content: JSON.stringify(encryptionResponse.data),
                    type: 'encrypted-image'
                },
                {
                    headers: {
                        Authorization: `Bearer ${user.address}`
                    }
                }
            );
            fetchMessages();
            fetchChattedUsers();
        } catch (err) {
            console.error('Error sending encrypted image:', err);
        }
    };
    const fetchMessages = async () => {
        if (!selectedUser) return;
        try {
            const response = await axios.get(`http://localhost:3001/api/messages/${selectedUser}`, {
                headers: {
                    Authorization: `Bearer ${user.address}`
                }
            });
            setMessages(response.data);
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        if (selectedUser) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    if (!user) return null;

    // const handleVoiceCommand = () => {
    //     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    //     recognition.lang = "en-US";
    //     recognition.start();
    
    //     recognition.onresult = (event) => {
    //         const command = event.results[0][0].transcript.toLowerCase();
    //         console.log("Recognized command:", command);
    
    //         const match = command.match(/send (.+) to (.+)/);
    //         if (match) {
    //             const message = match[1].trim();  // Extract message
    //             const recipientName = match[2].trim(); // Extract recipient's name
    
    //             const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
    //             if (recipient) {
    //                 setSelectedUser(recipient.address); // Open chat
    //                 setTimeout(() => sendMessageFromVoice(message), 500); // Send message
    //             } else {
    //                 alert(`User '${recipientName}' not found.`);
    //             }
    //         } else {
    //             alert("Invalid command. Try saying 'Send Hi to Shafar'.");
    //         }
    //     };
    // };
    
    // const handleVoiceCommand = () => {
    //     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    //     recognition.lang = "en-US";
    //     recognition.start();
    
    //     recognition.onresult = (event) => {
    //         const command = event.results[0][0].transcript.toLowerCase();
    //         console.log("Recognized command:", command);
    
    //         // Match "Send [message] to [recipient]"
    //         const sendMatch = command.match(/send (.+) to (.+)/);
    //         if (sendMatch) {
    //             const message = sendMatch[1].trim();
    //             const recipientName = sendMatch[2].trim();
    
    //             const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
    //             if (recipient) {
    //                 setSelectedUser(recipient.address); // Open chat
    //                 setTimeout(() => sendMessageFromVoice(message), 500); // Send message
    //             } else {
    //                 alert(`User '${recipientName}' not found.`);
    //             }
    //             return;
    //         }
    
    //         // Match "Open [recipient] chat"
    //         const openChatMatch = command.match(/open (.+) chat/);
    //         if (openChatMatch) {
    //             const recipientName = openChatMatch[1].trim();
    
    //             const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
    //             if (recipient) {
    //                 setSelectedUser(recipient.address); // Open chat
    //                 fetchMessages(); // Fetch messages for the selected user
    //             } else {
    //                 alert(`User '${recipientName}' not found.`);
    //             }
    //             return;
    //         }
    
    //         alert("Invalid command. Try saying 'Send Hi to Jamal' or 'Open Jamal chat'.");
    //     };
    // };

    // const sendMessageFromVoice = async (message) => {
    //     if (!selectedUser) return;
    
    //     try {
    //         await axios.post('http://localhost:3001/api/messages', {
    //             receiver: recipientAddress,
    //             content: message,
    //             type: 'text'
    //         }, {
    //             headers: {
    //                 Authorization: `Bearer ${user.address}`
    //             }
    //         });
    
    //         fetchMessages(); // Fetch messages again after sending
    //         fetchChattedUsers(); // Update the chat list if necessary
    
    //     } catch (err) {
    //         console.error("Error sending voice message:", err);
    //     }
    // };

    // const handleVoiceCommand = () => {
    //     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    //     recognition.lang = "en-US";
    //     recognition.start();
    
    //     recognition.onresult = (event) => {
    //         const command = event.results[0][0].transcript.toLowerCase();
    //         console.log("Recognized command:", command);
    
    //         // Match "Send [message] to [recipient]"
    //         const sendMatch = command.match(/send (.+) to (.+)/);
    //         if (sendMatch) {
    //             const message = sendMatch[1].trim();
    //             const recipientName = sendMatch[2].trim();
    
    //             const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
    //             if (recipient) {
    //                 setSelectedUser(recipient.address); // Open chat
    //                 setTimeout(() => sendMessageFromVoice(message, recipient.address), 500); // ✅ Pass recipient address
    //             } else {
    //                 alert(`User '${recipientName}' not found.`);
    //             }
    //             return;
    //         }
    
    //         // Match "Open [recipient] chat"
    //         const openChatMatch = command.match(/open (.+) chat/);
    //         if (openChatMatch) {
    //             const recipientName = openChatMatch[1].trim();
    
    //             const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
    //             if (recipient) {
    //                 setSelectedUser(recipient.address); // Open chat
    //                 fetchMessages(); // Fetch messages for the selected user
    //             } else {
    //                 alert(`User '${recipientName}' not found.`);
    //             }
    //             return;
    //         }
    
    //         alert("Invalid command. Try saying 'Send Hi to Jamal' or 'Open Jamal chat'.");
    //     };
    // };
    
    const handleVoiceCommand = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.start();
    
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log("Recognized command:", command);
    
            // Match "Send [message] to [recipient]"
            const sendMatch = command.match(/send (.+) to (.+)/);
            if (sendMatch) {
                const message = sendMatch[1].trim();
                const recipientName = sendMatch[2].trim();
    
                const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
                if (recipient) {
                    setSelectedUser(recipient.address); // Open chat
                    setTimeout(() => sendMessageFromVoice(message, recipient.address), 500); // ✅ Pass recipient address
                } else {
                    alert(`User '${recipientName}' not found.`);
                }
                return;
            }
    
            // Match "Open [recipient] chat"
            const openChatMatch = command.match(/open (.+) chat/);
            if (openChatMatch) {
                const recipientName = openChatMatch[1].trim();
    
                const recipient = filteredUsers.find(user => user.nickname.toLowerCase() === recipientName.toLowerCase());
    
                if (recipient) {
                    setSelectedUser(recipient.address); // Open chat
                    fetchMessages(); // Fetch messages for the selected user
                } else {
                    alert(`User '${recipientName}' not found.`);
                }
                return;
            }
    
            // Match "Logout" or "Log out"
            if (command === "logout" || command === "log out") {
                handleLogout();
                return;
            }
    
            alert("Invalid command. Try saying 'Send Hi to Jamal', 'Open Jamal chat', or 'Logout'.");
        };
    };
    
    const sendMessageFromVoice = async (message, recipientAddress) => {
        if (!recipientAddress) return;
    
        try {
            await axios.post('http://localhost:3001/api/messages', {
                receiver: recipientAddress,
                content: message,
                type: 'text'
            }, {
                headers: {
                    Authorization: `Bearer ${user.address}`
                }
            });
    
            fetchMessages(); // Fetch messages again after sending
            fetchChattedUsers(); // Update the chat list if necessary
    
        } catch (err) {
            console.error("Error sending voice message:", err);
        }
    };
    
    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            {/* Left Sidebar */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                {/* User Header */}
                <div className="p-4 bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                                    {user?.nickname[0]?.toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                            </div>
                            <div>
                                <h2 className="text-white font-semibold">{user?.nickname}</h2>
                                <p className="text-xs text-gray-400 truncate w-40">{user?.address}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleVoiceCommand}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                        <svg
                            className="absolute left-3 top-3 w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.address}
                            onClick={() => setSelectedUser(user.address)}
                            className={`flex items-center p-4 cursor-pointer transition-colors ${selectedUser === user.address
                                    ? 'bg-gray-700'
                                    : 'hover:bg-gray-700/50'
                                } border-b border-gray-700`}
                        >
                            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3">
                                {user.nickname[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-100 truncate">{user.nickname}</h3>
                                <p className="text-xs text-gray-400 truncate">{user.address}</p>
                            </div>
                            {selectedUser === user.address && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 animate-pulse"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                {selectedUser && (
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex items-center">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3">
                            {filteredUsers.find(u => u.address === selectedUser)?.nickname[0].toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-white font-medium">
                                {filteredUsers.find(u => u.address === selectedUser)?.nickname}
                            </h2>
                            <p className="text-xs text-gray-400">Online</p>
                        </div>
                    </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === user.address ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`relative max-w-lg p-4 rounded-2xl ${msg.sender === user.address
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                                } shadow-lg transition-transform duration-200 hover:scale-[1.02]`}>
                                {msg.type === 'encrypted-image' ? (
                                    <EncryptedImageMessage msg={msg} user={user} />
                                ) : msg.type === 'image' ? (
                                    <img
                                        src={`http://localhost:3001/uploads/${msg.content}`}
                                        alt="chat"
                                        className="max-w-full h-auto rounded-lg"
                                    />
                                ) : (
                                    <p className="text-gray-100">{msg.content}</p>
                                )}
                                <span className="absolute bottom-2 right-3 text-xs text-gray-300/70">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {/* Message tail */}
                                <div className={`absolute bottom-0 ${msg.sender === user.address ? '-right-2' : '-left-2'
                                    } w-4 h-4 overflow-hidden`}>
                                    <div className={`w-full h-full ${msg.sender === user.address ? 'bg-blue-600' : 'bg-gray-700'
                                        } transform rotate-45 origin-bottom-left`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="p-4 bg-gray-900 border-t border-gray-700">
                    <form onSubmit={sendMessage} className="flex items-center gap-3">
                        <label className="cursor-pointer text-gray-400 hover:text-blue-500 transition-colors p-2">
                            <PhotoIcon className="w-6 h-6" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={sendImage}
                                className="hidden"
                                disabled={!selectedUser}
                            />
                        </label>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full pl-4 pr-16 py-3 bg-gray-800 text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all"
                                disabled={!selectedUser}
                            />
                            <button
                                type="submit"
                                disabled={!selectedUser || !newMessage.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <PaperAirplaneIcon className="w-5 h-5 transform rotate-45" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
};

export default ChatPage;
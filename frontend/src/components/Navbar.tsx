import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthToken, getAuthToken } from "../services/api_service";
import { useAuth } from "../AuthContext";


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { clearAuthData } = useAuth();
  const handleSignOut = () => {
    clearAuthToken();
    clearAuthData();
    navigate("/");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md fixed w-full z-50">
      <div className="text-2xl font-bold text-indigo-600">ChatKit.ai</div>
      <div className="hidden md:flex space-x-6 items-center">
        <Link to="/home" className="hover:text-indigo-600">Home</Link>
        <Link to="/create-chatbot" className="hover:text-indigo-600">Configure Chatbot</Link>
        <Link to="/analytics" className="hover:text-indigo-600">Analytics</Link>
        {/* <Link to="/about" className="hover:text-indigo-600">About Us</Link> */}
        <Link to="/home#about-us" className="hover:text-indigo-600">About Us</Link>

        {getAuthToken() && (
          <button
            onClick={handleSignOut}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Sign Out
          </button>
        )}
      </div>
      {/* Mobile Hamburger */}
      <button
        className="md:hidden text-gray-600 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md flex flex-col items-center space-y-4 py-6 md:hidden">
          <Link to="/home" onClick={() => setIsOpen(false)} className="hover:text-indigo-600">Home</Link>
          <Link to="/create-chatbot" onClick={() => setIsOpen(false)} className="hover:text-indigo-600">Configure Chatbot</Link>
          <Link to="/analytics" onClick={() => setIsOpen(false)} className="hover:text-indigo-600">Analytics</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className="hover:text-indigo-600">About Us</Link>
          {getAuthToken() && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

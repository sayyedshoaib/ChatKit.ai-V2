import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="text-2xl font-bold text-indigo-500 mb-4 md:mb-0">
          ChatKit.ai
        </div>
        <div className="flex space-x-6 mb-4 md:mb-0">
          <Link to="/home" className="hover:text-white transition">Home</Link>
          <Link to="/create-chatbot" className="hover:text-white transition">Configure Chatbot</Link>
          <Link to="/analytics" className="hover:text-white transition">Analytics</Link>
          <Link to="/about" className="hover:text-white transition">About Us</Link>
        </div>
        <div className="text-sm text-center md:text-right">
          <p>&copy; {new Date().getFullYear()} ChatKit.ai. All rights reserved.</p>
          <div className="space-x-4 mt-2">
            <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "painter") {
        navigate("/painter/dashboard");
      } else if (user.role === "customer") {
        navigate("/customer/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            🎨 Painter Booking System
          </h1>
          <p className="text-2xl text-gray-600 mb-12">
            Connect customers with professional painters effortlessly
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition">
              <div className="text-5xl mb-4">🧑‍💼</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                For Customers
              </h2>
              <ul className="text-left space-y-3 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Request bookings for specific time slots
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Automatic painter assignment
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  View all your upcoming bookings
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">✓</span>
                  Get alternative time slot recommendations
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition">
              <div className="text-5xl mb-4">👨‍🎨</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                For Painters
              </h2>
              <ul className="text-left space-y-3 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Manage your availability schedule
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Receive automatic booking assignments
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  View all assigned jobs
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Build your reputation with more bookings
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-white text-blue-600 text-lg rounded-xl font-medium hover:bg-gray-50 transition shadow-lg border-2 border-blue-600"
            >
              Sign In
            </button>
          </div>

          <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-3">1️⃣</div>
                <h4 className="font-bold text-gray-800 mb-2">Register</h4>
                <p className="text-gray-600">
                  Sign up as a painter or customer
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">2️⃣</div>
                <h4 className="font-bold text-gray-800 mb-2">
                  Set Availability / Request
                </h4>
                <p className="text-gray-600">
                  Painters set their schedule, customers request bookings
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3">3️⃣</div>
                <h4 className="font-bold text-gray-800 mb-2">Get Matched</h4>
                <p className="text-gray-600">
                  Our system automatically matches the best painter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import Home from './pages/User/Home.jsx';
import BloodRequests from './pages/User/bloodRequests.jsx';
import RequestForm from './pages/User/RequestForm.jsx';
import MyRequests from './pages/User/MyRequests.jsx';
import Profile from './pages/User/Profile.jsx';
import EducationalContent from './pages/User/EducationalContent.jsx';
import './App.css';
import Navigation from './pages/Auth/Navigation.jsx'

function App() {
  return (
    <Router>
      <Navigation />
      <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bloodRequests" element={<BloodRequests />} />
        <Route path="/RequestForm" element={<RequestForm />} />
        <Route path="/myRequests" element={<MyRequests />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/EducationalContent" element={<EducationalContent />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
         </main>
    </Router>
  );
}

export default App;
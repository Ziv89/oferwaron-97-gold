// App.js
import React from 'react';
import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
import imageLogo from './images/logo.jpg';
import Introduction from './components/introduction';
import AboutMe from './components/aboutme';
import Dashboard from './components/dashboard';
import Footer from "./components/footer/footer";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <img src={imageLogo} className="App-logo swing" alt="logo" />

          <div className="App-nav-wrapper">
            <nav className="App-nav">
              <NavLink to="/aboutme" className={({ isActive }) => isActive ? "App-nav-link active" : "App-nav-link"}>
                About and Connection
              </NavLink>
{/* 
              <NavLink to="/tradeview" className={({ isActive }) => isActive ? "App-nav-link active" : "App-nav-link"}>
                TradeView
              </NavLink> */}

              <NavLink to="/introduction" className={({ isActive }) => isActive ? "App-nav-link active" : "App-nav-link"}>
                Introduction
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<Navigate to="/introduction" replace />} />
            <Route path="/introduction" element={<Introduction />} />
            <Route path="/aboutme" element={<AboutMe />} />
            {/* <Route path="/tradeview" element={<Dashboard />} /> */}
            <Route path="*" element={<Navigate to="/introduction" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

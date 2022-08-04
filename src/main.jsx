import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./styles/bootstrap.min.css";
import "./styles/custom.css";

import NavBar from "./components/NavBar";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import ChatView from "./components/ChatView";

// Render NavBar on every page and let the router handle the main content
ReactDOM.createRoot(document.getElementById("root")).render(
	<Router>
		<NavBar />
		<Routes>
			<Route path="/auth/register" element={<Register />} />

			<Route path="/auth/login" element={<Login />} />

			<Route path="/profile" element={<Profile />} />

			<Route path="/messages" element={<ChatView />} />
		</Routes>
	</Router>
);

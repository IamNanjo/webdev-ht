import { useState, useEffect, use } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	const location = useLocation().pathname;
	const navigate = useNavigate();

	useEffect(() => {
		document.title = "Login | WhatUpp";
	});

	const updateUsername = (e) => setUsername(e.target.value);
	const updatePassword = (e) => setPassword(e.target.value);

	function handleSubmit(e) {
		e.preventDefault();

		fetch(location, {
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			redirect: "follow",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ username, password })
		}).then(
			async (res) => {
				if (res.redirected) return navigate("/messages");

				const data = await res.json();
				setErrorMsg(data.message);
			},
			(err) => console.error(err)
		);
	}

	return (
		<main className="container">
			<h1 className="text-center my-3">Login</h1>
			<form method="post" className="mx-auto" onSubmit={handleSubmit}>
				<div className="form-group">
					<label htmlFor="username">Username</label>
					<div className="input-group">
						<div className="input-group-prepend">
							<span className="input-group-text material-symbols-rounded">
								person
							</span>
						</div>
						<input
							id="username"
							className="form-control"
							name="username"
							type="text"
							autoComplete="username"
							placeholder="User123"
							required
							autoFocus
							onInput={updateUsername}
						/>
					</div>
				</div>
				<div className="form-group">
					<label htmlFor="password">Password</label>
					<div className="input-group">
						<div className="input-group-prepend">
							<span className="input-group-text material-symbols-rounded">
								lock
							</span>
						</div>
						<input
							id="password"
							className="form-control"
							name="password"
							type="password"
							autoComplete="current-password"
							placeholder="••••••"
							required
							onInput={updatePassword}
						/>
					</div>
				</div>

				<AnimatePresence>
					{errorMsg && (
						<motion.div
							className="alert alert-danger"
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6 }}
							exit={{ opacity: 0 }}
						>
							{errorMsg}
						</motion.div>
					)}
				</AnimatePresence>
				<button
					className="d-block btn btn-primary mx-auto mt-4"
					type="submit"
				>
					Sign in
				</button>
			</form>
		</main>
	);
}

export default Login;

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Register() {
	useEffect(() => {
		document.title = "Create account | WhatUpp";
	});

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	const [passwordCharCountOk, setPasswordCharCountOk] = useState(false);
	const [passwordHasLetters, setPasswordHasLetters] = useState(false);
	const [passwordHasNumbers, setPasswordHasNumbers] = useState(false);
	const [passwordHasSymbols, setPasswordHasSymbols] = useState(false);

	const updateEmail = (e) => setEmail(e.target.value);
	const updateUsername = (e) => setUsername(e.target.value);
	const updatePassword = (e) => {
		setPassword(e.target.value);

		setPasswordCharCountOk(/.{6,}/gi.test(e.target.value));
		setPasswordHasLetters(/[A-Z]|[ÅÄÖÆØ]/gi.test(e.target.value));
		setPasswordHasNumbers(/\d/gi.test(e.target.value));
		setPasswordHasSymbols(
			/[~`!@#\$%\^&\*\+=\_\-"'<,>.\?]/gi.test(e.target.value)
		);
	};
	const updatePasswordConfirm = (e) => setPasswordConfirm(e.target.value);

	const location = useLocation().pathname;
	const navigate = useNavigate();

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
			body: JSON.stringify({
				email,
				username,
				password
			})
		}).then(
			async (res) => {
				if (res.redirected) navigate("/messages");
				else {
					const data = await res.json();
					setErrorMsg(data.message);
				}
			},
			(err) => console.error(err)
		);
	}

	return (
		<main className="container">
			<h1 className="text-center my-3">Create account</h1>,
			<form method="post" className="mx-auto" onSubmit={handleSubmit}>
				<div className="form-group">
					<label htmlFor="email">Email</label>
					<div className="input-group">
						<div className="input-group-prepend">
							<span className="input-group-text material-symbols-rounded">
								alternate_email
							</span>
						</div>

						<input
							id="email"
							className="form-control"
							name="email"
							type="email"
							autoComplete="email"
							required
							autoFocus
							onInput={updateEmail}
						/>
					</div>
				</div>
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
							required
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
							autoComplete="new-password"
							title="Minimum 6 characters"
							required
							onInput={updatePassword}
						/>
					</div>
				</div>

				<ul className="list-group my-2">
					<li
						className={`list-group-item ${
							passwordCharCountOk
								? "list-group-item-success"
								: "list-group-item-danger"
						}`}
					>
						<span className="material-symbols-rounded mr-2 align-middle">
							{passwordCharCountOk == true ? "done" : "close"}
						</span>
						<u>Is at least 6 characters long</u>
					</li>
					<li
						className={`list-group-item ${
							passwordHasLetters
								? "list-group-item-success"
								: "list-group-item-danger"
						}`}
					>
						<span className="material-symbols-rounded mr-2 align-middle">
							{passwordHasLetters == true ? "done" : "close"}
						</span>
						Has letters
					</li>
					<li
						className={`list-group-item ${
							passwordHasNumbers
								? "list-group-item-success"
								: "list-group-item-danger"
						}`}
					>
						<span className="material-symbols-rounded mr-2 align-middle">
							{passwordHasNumbers == true ? "done" : "close"}
						</span>
						Has numbers
					</li>
					<li
						className={`list-group-item ${
							passwordHasSymbols
								? "list-group-item-success"
								: "list-group-item-danger"
						}`}
					>
						<span className="material-symbols-rounded mr-2 align-middle">
							{passwordHasSymbols == true ? "done" : "close"}
						</span>
						Has symbols
					</li>
				</ul>
				<div className="form-group">
					<label htmlFor="password-confirm">Confirm password</label>
					<div className="input-group">
						<div className="input-group-prepend">
							<span className="input-group-text material-symbols-rounded">
								lock
							</span>
						</div>
						<input
							id="password-confirm"
							className="form-control"
							name="password-confirm"
							type="password"
							autoComplete="new-password"
							required
							onInput={updatePasswordConfirm}
						/>
					</div>

					<AnimatePresence>
						{password != passwordConfirm && (
							<motion.div
								className="alert alert-danger mt-2"
								initial={{ opacity: 0, scale: 0 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.6 }}
								exit={{ opacity: 0 }}
							>
								Passwords do not match
							</motion.div>
						)}
					</AnimatePresence>
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
					Create account
				</button>
			</form>
		</main>
	);
}

export default Register;

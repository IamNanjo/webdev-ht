import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Profile() {
	const [header, setHeader] = useState("Profile");
	const [userProfile, setUserProfile] = useState({
		email: "",
		username: ""
	});
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [statusMsg, setStatusMsg] = useState("");
	const [updated, setUpdated] = useState(false);

	const location = useLocation().pathname;
	const navigate = useNavigate();

	const getProfile = () =>
		fetch("/api/profile", {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin"
		}).then(
			async (res) => {
				if (res.status == 200) {
					const data = await res.json();
					setUserProfile(data);
					setHeader(`${data.username}'s profile`);
					document.title = `${data.username}'s profile | WhatUpp`;
				} else {
					setStatusMsg(
						`Could not get profile. HTTP status code: ${res.status}`
					);
					setUpdated(false);
				}
			},
			(err) => console.error(err)
		);

	useEffect(() => {
		getProfile();
	}, []); // Empty dependency array: run only once

	const updateEmail = (e) =>
		setUserProfile({
			email: e.target.value,
			username: userProfile.username
		});
	const updateUsername = (e) =>
		setUserProfile({
			email: userProfile.email,
			username: e.target.value
		});

	const updateCurrentPassword = (e) => setCurrentPassword(e.target.value);
	const updateNewPassword = (e) => setNewPassword(e.target.value);

	function handleSubmit(e) {
		e.preventDefault();

		fetch(location, {
			method: "PUT",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				...userProfile,
				currentPassword,
				newPassword
			})
		}).then(
			async (res) => {
				if (res.status == 200) {
					setStatusMsg("Changes saved");
					setUpdated(true);

					setTimeout(() => setStatusMsg(""), 10000);
					getProfile();
				} else {
					const data = await res.json();

					setStatusMsg(data.message);
					setUpdated(false);

					setTimeout(() => setStatusMsg(""), 10000);
				}
			},
			(err) => console.error(err)
		);
	}

	function handleDeleteUser(e) {
		e.preventDefault();

		const confirmation = confirm(
			`Are you sure you want to delete your account? (${userProfile.username})`
		);
		if (!confirmation) return;

		fetch(location, {
			method: "DELETE",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin"
		}).then(
			(res) => {
				if (res.status == 200) {
					setUpdated(true);

					let i = 6;

					const timer = setInterval(() => {
						i--;

						setStatusMsg(
							`Account deleted. You will be logged out in ${i} seconds...`
						);

						if (i <= 0) {
							clearInterval(timer);
							navigate("/auth/logout");
							return;
						}
					}, 1000);
				} else {
					setStatusMsg(
						`Failed to delete account. HTTP status code: ${res.status}`
					);
					setUpdated(false);

					setTimeout(() => setStatusMsg(""), 5000);
				}
			},
			(err) => console.error(err)
		);
	}

	return (
		<main className="container">
			<h1 className="text-center my-3">{header}</h1>
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
							value={userProfile.email}
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
							value={userProfile.username}
							autoComplete="username"
							required
							autoFocus
							onInput={updateUsername}
						/>
					</div>
				</div>

				<h3 className="text-center my-3">Change password</h3>

				<div className="form-group">
					<label htmlFor="current-password">Current password</label>
					<div className="input-group">
						<div className="input-group-prepend">
							<span className="input-group-text material-symbols-rounded">
								lock
							</span>
						</div>
						<input
							id="current-password"
							className="form-control"
							name="current-password"
							type="password"
							autoComplete="current-password"
							placeholder="••••••"
							required
							onInput={updateCurrentPassword}
						/>
					</div>
				</div>

				<div className="form-group">
					<label htmlFor="new-password">New password</label>
					<div className="input-group">
						<div className="input-group-prepend">
							<span className="input-group-text material-symbols-rounded">
								lock
							</span>
						</div>
						<input
							id="new-password"
							className="form-control"
							name="new-password"
							type="password"
							autoComplete="new-password"
							placeholder="••••••"
							required
							onInput={updateNewPassword}
						/>
					</div>
				</div>

				<AnimatePresence>
					{statusMsg && (
						<motion.div
							className={`alert ${
								updated ? "alert-success" : "alert-danger"
							}`}
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6 }}
							exit={{ opacity: 0 }}
						>
							{statusMsg}
						</motion.div>
					)}
				</AnimatePresence>
				<div className="d-flex justify-content-between mx-auto mt-4">
					<button className="d-block btn btn-primary" type="submit">
						Update
					</button>
					<button
						className="d-block btn btn-danger"
						onClick={handleDeleteUser}
					>
						Delete account
					</button>
				</div>
			</form>
		</main>
	);
}

export default Profile;

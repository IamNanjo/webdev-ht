import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function NavBar() {
	const [username, setUsername] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef();

	const location = useLocation();
	const navigate = useNavigate();

	const dropdownAnimation = {
		enter: {
			opacity: 1,
			transition: {
				duration: 0.25
			},
			display: "block"
		},
		exit: {
			opacity: 0,
			transition: {
				duration: 0.25
			},
			transitionEnd: {
				display: "none"
			}
		}
	};

	const toggleDropdown = (e, hide) => {
		if (hide == undefined) return setIsOpen(!isOpen);
		setIsOpen(hide);
	};

	useEffect(() => {
		function handleClickOutsideDropdown(e) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target)
			) {
				setIsOpen(false);
			}
		}

		window.addEventListener("mousedown", handleClickOutsideDropdown);
		return () => {
			document.removeEventListener(
				"mousedown",
				handleClickOutsideDropdown
			);
		};
	}, [dropdownRef]); // Ref dependency: run when ref is updated

	useEffect(() => {
		if (/^\/auth\/logout/i.test(location.pathname)) return logout();

		fetch("/api/profile", {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin"
		}).then(
			async (res) => {
				if (res.status == 401) return undefined;
				else if (res.status == 200) {
					const data = await res.json();
					setUsername(data.username);
				}
			},
			(err) => console.error(err)
		);
	}, [location]); // Location dependency: run again whenever route changes

	const logout = (e) => {
		if (e) e.preventDefault();
		fetch("/auth/logout", {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin"
		}).then(
			(res) => {
				setUsername("");
				setIsOpen(false);
				navigate("/auth/login");
			},
			(err) => console.error(err)
		);
	};

	return (
		<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
			<div className="navbar-brand noselect">WhatUpp</div>

			<ul className="navbar-nav mr-auto">
				<li className="nav-item">
					<Link to="/messages" className="nav-link">
						Messages
					</Link>
				</li>
			</ul>

			{/* When the user is not logged in and the route is currently not /auth/login(/) or /auth/register(/) */}
			{!username &&
				!/^\/auth\/(register|login)/i.test(location.pathname) && [
					<Link
						key={"1"}
						to="/auth/login"
						className="text-center mr-4 btn btn-primary"
					>
						Login
					</Link>,
					<Link
						key={"2"}
						to="/auth/register"
						className="text-center mr-4 btn btn-primary"
					>
						Create account
					</Link>
				]}

			{/* When current route is /auth/register(/) */}
			{/^\/auth\/register/i.test(location.pathname) && (
				<Link
					to="/auth/login"
					className="text-center mr-4 btn btn-primary"
				>
					Login
				</Link>
			)}

			{/* When current route is /auth/register(/) */}
			{/^\/auth\/login/i.test(location.pathname) && (
				<Link
					to="/auth/register"
					className="text-center mr-4 btn btn-primary"
				>
					Create account
				</Link>
			)}

			{/* When user is logged in */}
			{username && (
				<div ref={dropdownRef} className="dropdown">
					<button
						id="dropdownMenuButton"
						className="btn btn-primary"
						type="button"
						aria-haspopup="true"
						onClick={toggleDropdown}
					>
						<span className="material-symbols-rounded mr-2 align-middle">
							person
						</span>
						{username}
						<span className="material-symbols-rounded ml-2 align-middle">
							expand_more
						</span>
					</button>

					{/* Animate dropdown */}
					<motion.div
						className="dropdown-menu dropdown-menu-right"
						aria-labelledby="dropdownMenuButton"
						animate={isOpen ? "enter" : "exit"}
						variants={dropdownAnimation}
					>
						<Link
							to="/profile"
							className="dropdown-item btn btn-primary"
							onClick={(e) => setIsOpen(false)}
						>
							Profile
						</Link>

						<Link
							to="/auth/logout"
							className="dropdown-item btn btn-primary"
							onClick={logout}
						>
							Logout
						</Link>
					</motion.div>
				</div>
			)}
		</nav>
	);
}

export default NavBar;

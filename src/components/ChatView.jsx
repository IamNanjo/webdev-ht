import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ChatView() {
	const messagesEndRef = useRef(null);
	const [loggedInUser, setLoggedInUser] = useState("");
	const [userSearchIsOpen, setUserSearchIsOpen] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [chatList, setChatList] = useState([]);
	const [messages, setMessages] = useState([]);
	const [selectedChat, setSelectedChat] = useState("");
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [currentMsg, setCurrentMsg] = useState("");

	const getMessages = () =>
		fetch("/api/chats", {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(
			async (res) => {
				if (res.status != 200) return;
				const data = await res.json();

				setChatList(data.chatList);

				return data.chatList;
			},
			(err) => console.error(err)
		);

	const sendMessage = (e) => {
		e.preventDefault();

		const recipient = selectedChat;
		const message = currentMsg;

		if (!recipient || !message) return;

		fetch("/api/messages", {
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				recipient,
				message
			})
		}).then(
			() => {
				setCurrentMsg("");
				getMessages();
			},
			(err) => console.error(err)
		);
	};

	// Run when mounted
	useEffect(() => {
		document.title = "WhatUpp";

		// Get logged in user's id and fetch messages
		fetch("/api/profile", {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(
			async (res) => {
				const user = await res.json();
				setLoggedInUser(user.id);
				getMessages();
			},
			(err) => console.error(err)
		);

		// Background updates for messages
		// Every 1 second for web workers and every 2.5 seconds for normal setInterval
		if (typeof Worker !== "undefined") {
			const worker = new Worker("/background-updates.js", {
				credentials: "same-origin"
			});
			worker.onmessage = (e) => {
				if (!Object.keys(e.data).includes("error")) {
					setChatList(e.data.chatList);
				}
			};
		} else {
			setInterval(getMessages, 2500);
		}
	}, []);

	useEffect(() => {
		if (selectedChat) {
			// Choose the correct chat from the list whenever a new chat is selected or chatList is updated
			const chat = chatList.filter((chat) => chat._id == selectedChat)[0];
			if (!messages.length || messages != chat.messages) {
				let rect = messagesEndRef.current?.getBoundingClientRect();

				// Scroll to bottom unless the user had scrolled far enough away from the bottom
				if (rect.top >= 0 && rect.bottom <= window.innerHeight + 100) {
					messagesEndRef.current?.scrollIntoView({
						behavior: "smooth"
					});
					setMessages(chat.messages);
				} else {
					setMessages(chat.messages);
				}
			}
		}
	}, [selectedChat, chatList]);

	// Create a new chat with the selected users
	const createChat = (e) => {
		fetch("/api/chats", {
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				userList: selectedUsers
			})
		}).then(
			(res) => {
				setUserSearchIsOpen(false);
				setSelectedUsers([]);
				getMessages();
			},
			(err) => console.error(err)
		);
	};

	// Delete a chat
	const deleteChat = (confirmed = false) => {
		if (!confirmed) return;

		setDeleteConfirmation("");
		if (selectedChat == deleteConfirmation) {
			setSelectedChat("");
			setMessages([]);
		}

		fetch("/api/chats", {
			method: "DELETE",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ id: deleteConfirmation })
		}).then(
			(res) => {
				if (res.status == 200) getMessages();
			},
			(err) => console.error(err)
		);
	};

	const selectChat = (e, id) => {
		if (selectedChat == id) return;

		// Deselect currently active chat
		Array.from(document.getElementById("chatList").children).forEach(
			(el) => {
				if (el.classList.contains("active")) {
					el.classList.remove("active");
				}
			}
		);

		// Select new chat (Loads messages into the view)
		setSelectedChat(id);

		e.currentTarget.classList.add("active");
	};

	// Search users for a new chat
	const searchUsers = (e) => {
		const val = e.target.value;

		fetch(`/api/users?searchWord=${val}`, {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(
			async (res) => {
				if (res.status != 200) return;
				const data = await res.json();

				setUsers(data.users);
			},
			(err) => console.error(err)
		);
	};

	// Select users when clicked
	const toggleUser = (e, id) => {
		if (selectedUsers.includes(id)) {
			setSelectedUsers(selectedUsers.filter((user) => user != id));
		} else {
			setSelectedUsers([...selectedUsers, id]);
		}
	};

	// Send messages using Enter and create linebreaks with Shift + Enter
	const handleMessageKeydown = (e) => {
		if (!e.shiftKey && e.key == "Enter") {
			e.preventDefault();
			sendMessage(e);
		}
	};

	return [
		<AnimatePresence>
			{deleteConfirmation && (
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					exit={{ opacity: 0 }}
					classList="modal"
					tabindex="-1"
					role="dialog"
				>
					<div
						className="modal-dialog modal-dialog-centered"
						role="document"
					>
						<div className="modal-content border border-secondary">
							<div className="modal-header">
								<h5 className="modal-title noselect">
									Are you sure you want to delete this chat?
								</h5>
								<span
									className="material-symbols-rounded"
									aria-label="Close"
									aria-hidden="true"
									onClick={(e) => setDeleteConfirmation("")}
									style={{ cursor: "pointer" }}
								>
									close
								</span>
							</div>
							<div className="d-flex justify-content-around modal-body">
								<button
									type="button"
									className="btn btn-secondary"
									onClick={(e) => setDeleteConfirmation("")}
								>
									Cancel
								</button>
								<button
									type="button"
									className="btn btn-danger"
									onClick={(e) => {
										deleteChat(true);
									}}
								>
									Delete chat
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>,
		<AnimatePresence>
			{userSearchIsOpen && (
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					exit={{ opacity: 0 }}
					classList="modal"
					tabindex="-1"
					role="dialog"
				>
					<div
						className="modal-dialog modal-lg modal-dialog-centered"
						role="document"
					>
						<div className="modal-content border border-secondary">
							<div className="modal-header">
								<h5 className="modal-title noselect">
									Select users
								</h5>
								<span
									className="material-symbols-rounded"
									aria-label="Close"
									aria-hidden="true"
									onClick={(e) => {
										setUserSearchIsOpen(false);
										setSelectedUsers([]);
									}}
									style={{ cursor: "pointer" }}
								>
									close
								</span>
							</div>
							<div className="modal-body">
								<input
									className="form-control mb-2"
									type="text"
									placeholder="Search"
									autoFocus
									onInput={searchUsers}
									onFocus={searchUsers}
								/>
								<ul className="list-group bg-dark p-5 overflow-scroll">
									{users.length > 0 &&
										users.map((user) => (
											<li
												className={`noselect list-group-item ${
													selectedUsers.includes(
														user._id
													)
														? "list-group-item-success"
														: null
												}`}
												onClick={(e) =>
													toggleUser(e, user._id)
												}
											>
												{user.username}
											</li>
										))}
								</ul>
							</div>
							<div className="modal-footer">
								<button
									type="button"
									className="btn btn-secondary"
									onClick={(e) => {
										setUserSearchIsOpen(false);
										setSelectedUsers([]);
									}}
								>
									Cancel
								</button>
								<button
									type="button"
									className="btn btn-primary"
									disabled={selectedUsers.length < 1}
									onClick={(e) => createChat()}
								>
									Create chat
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>,
		<main id="chatView">
			<div id="chatListPanel">
				<button
					className="btn btn-primary btn-block"
					onClick={(e) => setUserSearchIsOpen(true)}
				>
					<span className="material-symbols-rounded mr-2 align-middle">
						add
					</span>
					New chat
				</button>
				<ul id="chatList" className="list-group-flush bg-dark">
					{chatList.length > 0 &&
						chatList.map((chat) => {
							let members = "";
							if (chat.members.length <= 1)
								members = "Empty chat";
							else {
								for (let i = 0; i < chat.members.length; i++) {
									if (chat.members[i]._id == loggedInUser)
										members += "You";
									else members += chat.members[i].username;

									if (i != chat.members.length - 1)
										members += ", ";
								}
							}
							let lastMessage = "";
							if (chat.messages.length > 0) {
								lastMessage =
									chat.messages.slice(-1)[0].content;
							}
							return (
								<li
									key={chat._id}
									className={`list-group-item border border-secondary `}
									onMouseDown={(e) => selectChat(e, chat._id)}
								>
									<h2>
										<span
											className={`material-symbols-rounded align-middle pr-2 ${
												selectedChat == chat._id
													? null
													: "text-danger"
											}`}
											onClick={(e) => {
												e.stopPropagation();
												setDeleteConfirmation(chat._id);
											}}
										>
											delete
										</span>
										{!chat.members.length
											? "Empty chat"
											: members}
									</h2>
									{lastMessage != "" && (
										<div style={{ paddingLeft: "33px" }}>
											{lastMessage}
										</div>
									)}
								</li>
							);
						})}
				</ul>
			</div>
			<div id="messagePanel">
				<ul id="messageList">
					{messages.length > 0 &&
						messages.map((msg) => {
							// If the msg.sender is null, that means the user has been deleted
							if (msg.sender == null) {
								return (
									<li
										key={msg._id}
										className="message rounded border"
									>
										<h2>Deleted user</h2>
										<div>{msg.content}</div>
									</li>
								);
							} else if (msg.sender._id == loggedInUser) {
								return (
									<li
										key={msg._id}
										className="message rounded border float-right"
									>
										<div>{msg.content}</div>
									</li>
								);
							} else {
								return (
									<li
										key={msg._id}
										className="message rounded border"
									>
										<h2>{msg.sender.username}</h2>
										<div>{msg.content}</div>
									</li>
								);
							}
						})}
					<div ref={messagesEndRef} />
				</ul>
				<form
					id="messageForm"
					className="form-inline"
					onSubmit={sendMessage}
				>
					<textarea
						id="messageField"
						className="form-control"
						disabled={!selectedChat}
						value={currentMsg}
						placeholder="Type message here..."
						onInput={(e) => setCurrentMsg(e.target.value)}
						onKeyDown={handleMessageKeydown}
					></textarea>
					<button
						className="btn btn-primary rounded-circle"
						type="submit"
						disabled={!currentMsg || !selectedChat}
					>
						<span className="material-symbols-rounded">send</span>
					</button>
				</form>
			</div>
		</main>
	];
}

export default ChatView;

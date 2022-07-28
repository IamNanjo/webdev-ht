import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ChatView() {
	const messagesEndRef = useRef(null);
	const [userSearchIsOpen, setUserSearchIsOpen] = useState(false);
	const [chatList, setChatList] = useState([]);
	const [messages, setMessages] = useState([]);
	const [selectedChat, setSelectedChat] = useState("");
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [currentMsg, setCurrentMsg] = useState("");

	const getMessages = () => {
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
			},
			(err) => console.error(err)
		);
	};

	useEffect(() => {
		getMessages();

		// Background updates for messages
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
			setInterval(getMessages, 5000);
		}

		// Allow sending messages by pressing down Shift + Enter
		document.getElementById("messageForm").addEventListener("keydown", (e) => {
			if(e.shiftKey && e.key == "Enter") {
				sendMessage();
			}
		})
	}, []);

	useEffect(() => {
		// Scroll to bottom whenever message list changes
		if (localStorage.getItem("autoScroll"))
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

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

		// Choose the correct chat from the list
		const chat = chatList.filter((chat) => chat.id == id)[0];

		// Select new chat (Loads messages into the view)
		setSelectedChat(id);
		setMessages(chat.messages);

		e.currentTarget.classList.add("active");
	};

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

	const toggleUser = (e, id) => {
		if (selectedUsers.includes(id)) {
			setSelectedUsers(selectedUsers.filter((user) => user != id));
		} else {
			setSelectedUsers([...selectedUsers, id]);
		}
	};

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
			(res) => getMessages(),
			(err) => console.error(err)
		);
	};

	const updateMessage = (e) => setCurrentMsg(e.target.value);

	// Send message when the send button is clicked
	const sendMessage = () => {
		if (!selectedChat || !currentMsg) return undefined;
		fetch("/api/messages", {
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				recipient: selectedChat,
				message: currentMsg
			})
		}).then(
			(res) => getMessages(),
			(err) => console.error(err)
		);
	};

	return (
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
					{!!chatList.length &&
						chatList.map((chat) => {
							let lastMessage = "";
							if (chat.messages.length) {
								lastMessage = chat.messages.slice(-1)[0].message;
							}
							return (
								<li
									key={chat._id}
									className={`list-group-item border border-secondary `}
									onMouseDown={(e) => selectChat(e, chat._id)}
								>
									<h2>{chat.members.map((member, i, arr) => {
										if(i == arr.length - 1) return member.username;
										else return `${member.username}, `
									})}</h2>
									<div>{lastMessage}</div>
								</li>
							);
						})}
				</ul>
			</div>
			<div id="messagePanel">
				<AnimatePresence>
					{userSearchIsOpen && (
						<motion.div
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6 }}
							exit={{ opacity: 0 }}
							classList="modal"
							tabindex="-1"
							role="dialog"
						>
							<div
								class="modal-dialog modal-lg modal-dialog-centered"
								role="document"
							>
								<div class="modal-content">
									<div class="modal-header">
										<h5
											id="exampleModalLongTitle"
											class="modal-title"
										>
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
									<div class="modal-body">
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
															toggleUser(
																e,
																user._id
															)
														}
													>
														{user.username}
													</li>
												))}
										</ul>
									</div>
									<div class="modal-footer">
										<button
											type="button"
											class="btn btn-secondary"
											onClick={(e) => {
												setUserSearchIsOpen(false);
												setSelectedUsers([]);
											}}
										>
											Cancel
										</button>
										<button
											type="button"
											class="btn btn-primary"
											onClick={createChat}
										>
											Create chat
										</button>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
				<ul id="messageList">
					{!!messages.length &&
						messages.map((msg) => {
							if (msg.sender == "You") {
								return (
									<li
										key={msg.id}
										className="message rounded border float-right"
									>
										<div>{msg.message}</div>
									</li>
								);
							} else if (!selectedChat.isGroupChat) {
								return (
									<li
										key={msg.id}
										className="message rounded border"
									>
										<div>{msg.message}</div>
									</li>
								);
							} else {
								return (
									<li
										key={msg.id}
										className="message rounded border"
									>
										<h2>{msg.sender}</h2>
										<div>{msg.message}</div>
									</li>
								);
							}
						})}
					<div ref={messagesEndRef} />
				</ul>
				<form
					id="messageForm"
					className="form-inline"
					onsubmit={sendMessage}
				>
					<textarea
						className="form-control"
						placeholder="Type message here..."
						onInput={updateMessage}
					></textarea>
					<button
						className="btn btn-primary rounded-circle"
						type="submit"
					>
						<span className="material-symbols-rounded">send</span>
					</button>
				</form>
			</div>
		</main>
	);
}

export default ChatView;

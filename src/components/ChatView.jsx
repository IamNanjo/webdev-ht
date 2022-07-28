import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ChatView() {
	const messagesEndRef = useRef(null);
	const [userSearchIsOpen, setUserSearchIsOpen] = useState(false);
	const [chatList, setChatList] = useState([]);
	const [msgList, setMsgList] = useState([]);
	const [errorMsg, setErrorMsg] = useState("");
	const [selectedChat, setSelectedChat] = useState("");

	const getMessages = () => {
		fetch("/api/messages", {
			method: "GET",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			}
		}).then(
			async (res) => {
				const data = await res.json();

				if (res.status != 200)
					return setErrorMsg(`Error: ${data.message}`);

				setChatList(data.chatList);
			},
			(err) => console.error(err)
		);
	};

	useEffect(() => {
		getMessages();
		setMsgList([...msgList]);

		// Background updates for new messages
		if (typeof Worker !== "undefined") {
			const worker = new Worker("/background-updates.js", {
				credentials: "same-origin"
			});
			worker.onmessage = (e) => {
				console.log("e.data :>> ", e.data);
				if (Object.keys(e.data).includes("error"))
					setErrorMsg(e.data.error);
				else {
					setChatList(e.data.chatList);
				}
			};
		} else {
			setInterval(getMessages, 5000);
		}
	}, []);

	useEffect(() => {
		if (localStorage.getItem("autoScroll"))
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [msgList]); // Scroll to bottom whenever message list changes

	const selectChat = (e, id) => {
		if (selectedChat == id) return;

		setSelectedChat(id);

		const el = e.currentTarget;
		el.classList.add("active");

		// When some other chat is selected, deselect this one
		document.getElementById("chatList").addEventListener(
			"mousedown",
			function (ev) {
				ev.stopPropagation();
				if (ev.target && !ev.target.contains(el)) {
					el.classList.remove("active");
				}
			},
			{ once: true }
		);
	};

	const sendMessage = () => {
		if (!selectedChat) return undefined;
		fetch("/api/messages", {
			method: "POST",
			mode: "same-origin",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				recipient: "",
				message: ""
			})
		}).then(
			(res) => {},
			(err) => console.error(err)
		);
	};

	return (
		<main id="chatView">
			{errorMsg == "" && [
				<div id="chatListPanel">
					<button
						className="btn btn-primary btn-block"
						onClick={(e) => setUserSearchIsOpen(!userSearchIsOpen)}
					>
						<span className="material-symbols-rounded mr-2 align-middle">
							add
						</span>
						New chat
					</button>
					<ul id="chatList" className="list-group-flush bg-dark">
						{!!chatList.length &&
							chatList.map((chat) => {
								return (
									<li
										key={chat.id}
										className={`list-group-item border border-secondary `}
										onClick={(e) => selectChat(e, chat.id)}
									>
										<h2>{chat.chatName}</h2>
										<div>{chat.lastMsg}</div>
									</li>
								);
							})}
					</ul>
				</div>,
				<div id="messagePanel">
					{errorMsg && (
						<h2 className="mx-auto text-center">{errorMsg}</h2>
					)}
					{userSearchIsOpen && (
						<AnimatePresence>
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
									class="modal-dialog modal-dialog-centered"
									role="document"
								>
									<div class="modal-content">
										<div class="modal-header">
											<h5
												class="modal-title"
												id="exampleModalLongTitle"
											>
												Modal title
											</h5>
											<button
												type="button"
												class="close"
												data-dismiss="modal"
												aria-label="Close"
											>
												<span aria-hidden="true">
													&times;
												</span>
											</button>
										</div>
										<div class="modal-body">...</div>
										<div class="modal-footer">
											<button
												type="button"
												class="btn btn-secondary"
												data-dismiss="modal"
											>
												Close
											</button>
											<button
												type="button"
												class="btn btn-primary"
											>
												Save changes
											</button>
										</div>
									</div>
								</div>
							</motion.div>
						</AnimatePresence>
					)}
					<ul id="messageList">
						{!!msgList.length &&
							msgList.map((msg) => {
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
						></textarea>
						<button
							className="btn btn-primary rounded-circle"
							type="submit"
						>
							<span className="material-symbols-rounded">
								send
							</span>
						</button>
					</form>
				</div>
			]}
		</main>
	);
}

export default ChatView;

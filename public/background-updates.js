// Fetch messages and send them to the ChatView
const getMessages = () => {
	return fetch("/api/chats", {
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

			if (res.status != 200) postMessage({ error: data.message });
			else postMessage({ chatList: data.chatList });
		},
		(err) => console.error(err)
	);
};

setInterval(() => {
	getMessages();
}, 1000);

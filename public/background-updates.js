// Fetch messages and send them to the ChatView
const getMessages = (interval) => {
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
			// Close web worker if not logged in
			// Otherwise it will keep making requests unnecessary requests
			if (res.status == 401) {
				close();
			} else if (res.status != 200) {
				const data = await res.json();
				postMessage({ error: data.message });
			} else {
				const data = await res.json();
				postMessage({ chatList: data.chatList });
			}
		},
		(err) => console.error(err)
	);
};

const interval = setInterval(() => {
	getMessages(interval);
}, 1000);

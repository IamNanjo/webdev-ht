# Front-end

Aloitin työskentelyn tekemällä oman Bootstrap teemani [Bootstrap Build](https://bootstrap.build/) työkalun avulla,
jonka jälkeen aloin tutkimaan minkälainen layout voisi olla sopiva viestintäsovellukseen.
Päätin käyttää hyvin yksinkertaista sivupalkkia, jossa on keskustelut ja isoa viestilaatikkoa,
jossa itse lähetetyt viestit ovat tasattuna oikeaan reunaan ja muiden lähettämät viestit ovat tasattu vasempaan reunaan.
Navigointipalkkikin on hyvin minimaalinen, koska tässä sovelluksessa on niin vähän näkymiä.
Lopuksi tein sovelluksesta vielä ladattavan PWA:n (Firefox tuki on melko huono niissä).

<details><summary>main.jsx</summary><br>

Päätiedosto, jossa on määritetty css tiedostot ja reitit.

```javascript
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
```

</details>

## Komponentit

<details><summary>components/NavBar.jsx</summary><br>

Uloskirjautuminen, jos reitti on /auth/logout.
Muussa tapauksessa haetaan käyttäjän profiilin tiedot.

```javascript
useEffect(() => {
	// Clear console so that errors from other pages don't show up
	console.clear();

	if (/^\/auth\/logout/i.test(location.pathname)) return logout();

	// Get username for profile button
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
}, [location]);
```

<hr>

Tekee pyynnön, joka poistaa evästeen (kirjautuu ulos)

```javascript
const logout = (e) => {
	if (e) e.preventDefault();
	fetch("/auth/logout", {
		method: "GET",
		mode: "same-origin",
		cache: "no-cache",
		credentials: "same-origin"
	}).then(
		() => {
			setUsername("");
			setIsOpen(false);
			navigate("/auth/login");
		},
		(err) => console.error(err)
	);
};
```

<hr>

Muuttaa navigointilinkit riippuen tämänhetkisestä reitistä ja siitä, onko käyttäjä kirjautunut sisään.

```javascript
{
	!username &&
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
		];
}

{
	/* When current route is /auth/register(/) */
}
{
	/^\/auth\/register/i.test(location.pathname) && (
		<Link to="/auth/login" className="text-center mr-4 btn btn-primary">
			Login
		</Link>
	);
}

{
	/* When current route is /auth/register(/) */
}
{
	/^\/auth\/login/i.test(location.pathname) && (
		<Link to="/auth/register" className="text-center mr-4 btn btn-primary">
			Create account
		</Link>
	);
}
```

</details>

<details><summary>components/Register.jsx</summary><br>

Lomakkeen kenttien sisällöt ja virheviesti

```javascript
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [passwordConfirm, setPasswordConfirm] = useState("");
const [errorMsg, setErrorMsg] = useState("");
```

Salasanan vahvuustarkistusten tilat

```javascript
const [passwordCharCountOk, setPasswordCharCountOk] = useState(false);
const [passwordHasLetters, setPasswordHasLetters] = useState(false);
const [passwordHasNumbers, setPasswordHasNumbers] = useState(false);
const [passwordHasSymbols, setPasswordHasSymbols] = useState(false);
```

Lomakkeen kenttien sisältöjen päivitys (onInput)

```javascript
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
```

<hr>

Lomakkeen lähetyksen käsittely. Jos vastaus yrittää uudelleenohjata, niin käyttäjän luominen onnistui ja voidaan siirtyä viestinäkymään.

```javascript
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
```

<hr>

Salasanan vahvuustarkistusten piirtäminen

```javascript
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
		Has special characters
	</li>
</ul>
```

Animoidun varoituksen piirtäminen framer-motion kirjaston avulla

```javascript
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
```

</details>

<details><summary>components/Login.jsx</summary><br>

Lomakkeen kenttien arvot ja virheviestin arvo

```javascript
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [errorMsg, setErrorMsg] = useState("");
```

Lomakkeen kenttien arvojen päivittäminen

```javascript
const updateUsername = (e) => setUsername(e.target.value);
const updatePassword = (e) => setPassword(e.target.value);
```

<hr>

Lomakkeen lähetyksen käsittely. Jos vastaus yrittää uudelleenohjata, niin sisäänkirjautuminen onnistui ja voidaan siirtyä viestinäkymään

```javascript
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
```

</details>

<details><summary>components/Profile.jsx</summary><br>

Funktio profiilin hakua varten. Asettaa käyttäjänimen lomakkeeseen ja otsikkoon

```javascript
const [header, setHeader] = useState("Profile");
const [username, setUsername] = useState("");

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
				setUsername(data.username);
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
```

<hr>

Käsittelee käyttäjän poistopyynnön. Kirjautuu ulos, jos käyttäjän poistaminen onnistui tai näyttää virheilmoituksen.

```javascript
function handleDeleteUser(e) {
	e.preventDefault();

	const confirmation = confirm(
		`Are you sure you want to delete your account? (${username})`
	);
	if (!confirmation) return;

	fetch("/profile", {
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
```

</details>

<details><summary>components/ChatView.jsx</summary><br>

Funktio viestien hakemista varten ja web worker, joka suorittaa vastaavaa koodia sekunnin välein.

```javascript
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
```

web workerin käynnistäminen kerran suoritettavan useEffect callback funktion sisällä

```javascript
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
```

background-updates.js (web worker)

```javascript
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

setInterval(() => {
	getMessages();
}, 1000);
```

<hr>

ref div elementtiä varten.
Tämä elementti on viestilistan alaosassa,
jotta viestilistan alareunaan voi siirtyä helposti viestilistan päivittyessä.

```javascript
const messagesEndRef = useRef(null);

useEffect(() => {
	messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
```

<hr>

Keskustelua vaihtaessa suodattaa keskustelulistasta oikean keskustelun ja päivittää viestilistan, jos se on muuttunut

```javascript
useEffect(() => {
	if (selectedChat) {
		const chat = chatList.filter((chat) => chat._id == selectedChat)[0];
		if (
			!messages.length ||
			messages.slice(-1)[0]._id != chat.messages.slice(-1)[0]._id
		) {
			setMessages(chat.messages);
		}
	}
}, [selectedChat, chatList]);
```

<hr>

Funktiot keskustelun luontia ja poistoa varten

```javascript
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
		() => {
			setUserSearchIsOpen(false);
			setSelectedUsers([]);
			getMessages();
		},
		(err) => console.error(err)
	);
};

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
```

<hr>

Uuden keskustelun valinta

```javascript
const selectChat = (e, id) => {
	if (selectedChat == id) return;

	// Deselect currently active chat
	Array.from(document.getElementById("chatList").children).forEach((el) => {
		if (el.classList.contains("active")) {
			el.classList.remove("active");
		}
	});

	// Select new chat (Loads messages into the view)
	setSelectedChat(id);

	e.currentTarget.classList.add("active");
};
```

<hr>

Käyttäjien hakeminen uutta keskustelua varten ja niiden valitseminen

```javascript
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
```

<hr>

Funktio onKeyDown viestilaatikossa viestien lähettämistä varten. Rivinvaihto Shift + Enter

```javascript
const handleMessageKeydown = (e) => {
	if (!e.shiftKey && e.key == "Enter") {
		e.preventDefault();
		sendMessage(e);
	}
};
```

</details>

<details><summary>PWA</summary><br>

vite.config.js:<br>
webmanifest PWA:n kuvakkeita ja teeman tietoja varten

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.js",
			manifest: {
				$schema:
					"https://json.schemastore.org/web-manifest-combined.json",
				name: "WhatUpp",
				short_name: "WhatUpp",
				start_url: "/",
				display: "standalone",
				background_color: "#2C2F3A",
				theme_color: "#343A40",
				description: "A simple chat app",
				icons: [
					{
						src: "/favicon.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any"
					},
					{
						src: "/icons/manifest-icon-192.maskable.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable"
					},
					{
						src: "/icons/manifest-icon-512.maskable.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable"
					}
				]
			}
		})
	]
});
```

<hr>

sw.js (service worker)

Tällä konfiguraatiolla ohjelma yrittää hakea uutta tietoa ensin verkon kautta ennen välimuistin tarkistamista.
Varmistaa uusimpien viestien saamisen.

```javascript
// Default network-first service worker from Vite plugin PWA docs
// https://vite-plugin-pwa.netlify.app/workbox/inject-manifest.html#network-first-strategy

import { cacheNames, clientsClaim } from "workbox-core";
import {
	registerRoute,
	setCatchHandler,
	setDefaultHandler
} from "workbox-routing";
import { NetworkFirst, NetworkOnly, Strategy } from "workbox-strategies";

const data = {
	race: false,
	credentials: "same-origin",
	networkTimeoutSeconds: 2,
	fallback: false
};

const cacheName = cacheNames.runtime;

const buildStrategy = () => {
	if (data.race) {
		class CacheNetworkRace extends Strategy {
			_handle(request, handler) {
				const fetchAndCachePutDone = handler.fetchAndCachePut(request);
				const cacheMatchDone = handler.cacheMatch(request);

				return new Promise((resolve, reject) => {
					fetchAndCachePutDone.then(resolve).catch((e) => {});
					cacheMatchDone.then(
						(response) => response && resolve(response)
					);

					// Reject if both network and cache error or find no response.
					Promise.allSettled([
						fetchAndCachePutDone,
						cacheMatchDone
					]).then((results) => {
						const [fetchAndCachePutResult, cacheMatchResult] =
							results;
						if (
							fetchAndCachePutResult.status === "rejected" &&
							!cacheMatchResult.value
						)
							reject(fetchAndCachePutResult.reason);
					});
				});
			}
		}
		return new CacheNetworkRace();
	} else {
		if (data.networkTimeoutSeconds > 0)
			return new NetworkFirst({
				cacheName,
				networkTimeoutSeconds: data.networkTimeoutSeconds
			});
		else return new NetworkFirst({ cacheName });
	}
};

const manifest = self.__WB_MANIFEST;

const cacheEntries = [];

const manifestURLs = manifest.map((entry) => {
	const url = new URL(entry.url, self.location);
	cacheEntries.push(
		new Request(url.href, {
			credentials: data.credentials
		})
	);
	return url.href;
});

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(cacheName).then((cache) => {
			return cache.addAll(cacheEntries);
		})
	);
});

self.addEventListener("activate", (event) => {
	// - clean up outdated runtime cache
	event.waitUntil(
		caches.open(cacheName).then((cache) => {
			// clean up those who are not listed in manifestURLs
			cache.keys().then((keys) => {
				keys.forEach((request) => {
					if (!manifestURLs.includes(request.url)) {
						cache.delete(request).then((deleted) => {});
					}
				});
			});
		})
	);
});

registerRoute(({ url }) => manifestURLs.includes(url.href), buildStrategy());

setDefaultHandler(new NetworkOnly());

// fallback to app-shell for document request
setCatchHandler(({ event }) => {
	switch (event.request.destination) {
		case "document":
			return caches.match(data.fallback).then((r) => {
				return r
					? Promise.resolve(r)
					: Promise.resolve(Response.error());
			});
		default:
			return Promise.resolve(Response.error());
	}
});

// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting();
clientsClaim();

```

</details>

## Projektissa käytetyt kirjastot

-   vite
-   vite-plugin-pwa (PWA)
    -   workbox-build
    -   workbox-window
-   react
-   react-dom
-   react-router-dom (Reitit ja navigaatio reittien välillä)
-   framer-motion (Animaatiot)

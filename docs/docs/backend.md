# Back-end

<details><summary>server.js</summary><br>

Sisäänkirjautuessa käytettävä funktio (passport.authenticate()):<br>

<ol>

<li>User.findOne() etsii tietokannasta käyttäjän, jolla on sama käyttäjänimi kuin pyynnössä ja palauttaa käyttäjän callback funktioon.</li>

<li>Jos käyttäjää ei löydy, palautetaan virheviestinä väärä käyttäjänimi</li>

<li>Verrataan saadun käyttäjän salasanaa pyynnössä olevaan salasanaan bcrypt.compare() funktiolla</li>

<li>Jos salasana on oikein, niin käyttäjä kirjataan sisään. Muussa tapauksessa palautetaan virheviestinä väärä salasana</li>

</ol>

```javascript
new LocalStrategy((username, password, cb) => {
	// Looks for a user from the database and checks that the user gave the correct password
	User.findOne({ username }, (err, user) => {
		if (err) return cb(err);
		if (!user) {
			return cb(null, false, {
				message: "Incorrect username",
				status: 404
			});
		}

		bcrypt.compare(password, user.password, (err, result) => {
			if (err) return cb(err);
			if (!result) {
				return cb(null, false, {
					message: "Incorrect password",
					status: 403
				});
			}

			return cb(null, user);
		});
	});
});
```

<hr>

Valitaan evästeisiin tallennettavat tiedot (id ja käyttäjänimi):<br>

Tämä toimisi ihan hyvin pelkällä ID:lläkin, mutta tällä tavalla profiilin
pyynnöissä voidaan vastata evästeisiin tallennetuilla tiedoilla tietokannasta hakemisen sijaan

```javascript
passport.serializeUser((user, cb) => {
	process.nextTick(() => {
		return cb(null, {
			// Change MongoDB ObjectID to string
			id: user["_id"].toString(),
			username: user["username"]
		});
	});
});
```

Valitaan mitä halutaan kiinnittää req.user objektiin pyynnöissä:

Käytetään samoja arvoja, jotka on tallennettu evästeisiin serializeUser funktiossa.

```javascript
passport.deserializeUser((user, cb) => {
	process.nextTick(() => cb(null, user));
});
```

<hr>

Evästepohjaisten sessioiden konfiguraatio:<br>

<ul>
<li><i>secret:&nbsp;</i>määritetään jokin pitkä, turvallinen merkkisarja, jolla evästeet salataan. Tätä ei pitäisi olla julkisesti näkyvissä, mutta harjoitustyön ohjeessa oli sanottu, että "työn lähdekoodi ei voi olla miltään osin salaista".</li>

<li><i>store:&nbsp;</i>valitaan sessioiden tallennuspaikaksi MongoDB tietokanta</li>

<li><i>saveUninitialized:&nbsp;</i>ei tallenneta sessioita ellei käyttäjä kirjaudu sisään</li>

</ul>

```javascript
const store = new MongoDBStore({
	uri: mongoURI,
	collection: "sessions"
});

app.use(
	session({
		secret: "nmxLC3bG6rYPmR$B$CFDi!iR$qn34yonk7t5AHTx",
		resave: true,
		saveUninitialized: false,
		cookie: { secure: true },
		store: store
	})
);
```

<hr>

Kaikille reiteille yhteiset väliohjelmistot:

```javascript
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
```

</details>

## Reitit

<details><summary>routes/api.js</summary><br>

GET /api/profile:<br>

Vastataan evästeisiin tallennetuilla tiedoilla (ID ja käyttäjänimi)

```javascript
router.get("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	return res.json(req.user);
});
```

esimerkkivastaus:

```json
{
	"id": "62f5a935020cd6e520fa05b0",
	"username": "Nanjo"
}
```

<hr>

GET /api/users?searchWord:<br>

Ensin tarkistetaan, että pyynnöstä löytyy hakusana, jonka jälkeen
vastataan käyttäjälistalla, joka on suodatettu regex haulla hakusanaa hyödyntämällä. Tietokannan kysely suodattaa pois myös käyttäjän, joka teki pyynnön.

```javascript
router.get(
	"/users",
	body("searchWord").not().isEmpty().trim(),
	async (req, res) => {
		if (!req.isAuthenticated()) return res.sendStatus(401);

		const { searchWord } = req.query;
		User.find(
			{
				_id: { $ne: req.user.id },
				username: { $regex: `.*${searchWord}.*`, $options: "i" }
			},
			"_id username",
			(err, users) => {
				if (err) console.error(err);
				else res.json({ users });
			}
		);
	}
);
```

esimerkkivastaus (/api/users?searchWord=a):

```json
{
	"users": [
		{
			"_id": "62f5fe3c639809a9c218c902",
			"username": "Nanjo"
		}
	]
}
```

<hr>

GET /api/chats:<br>

Vastataan listalla niistä keskusteluista, joihin pyynnön tehnyt käyttäjä kuuluu. Listan keskustelut sisältävät myös niihin kuuluvat viestit.
Ennen vastausta täytetään kuitenkin kyselyyn keskusteluiden jäsenten ja viestien lähettäjien käyttäjänimet.

```javascript
router.get("/chats", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	const chats = await Chat.find({ members: req.user.id })
		.populate({
			path: "members",
			select: "_id username"
		})
		.populate({
			path: "messages.sender",
			select: "_id username"
		});

	res.json({ chatList: chats });
});
```

esimerkkivastaus:

```json
{
	"chatList": [
		{
			"_id": "62f6028438de031ab7672658",
			"members": [
				{
					"_id": "62f5fe3c639809a9c218c902",
					"username": "Nanjo"
				},
				{
					"_id": "62f5fe59d6c33b919f729412",
					"username": "IamNanjo"
				}
			],
			"messages": [
				{
					"sender": {
						"_id": "62f5fe3c639809a9c218c902",
						"username": "Nanjo"
					},
					"content": "Testi",
					"_id": "62f6028738de031ab7672663",
					"createdOn": "2022-08-12T07:34:31.550Z"
				}
			],
			"createdOn": "2022-08-12T07:34:28.451Z",
			"__v": 0
		}
	]
}
```

<hr>

POST /api/chats:<br>

Varmistaa, että pyynnössä on käyttäjälista ja luo uuden keskustelun, jos kaikki käyttäjälistan käyttäjät ovat olemassa.

```javascript
router.post("/chats", body("userList").isArray(), async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });

	const { userList } = req.body;

	// Make sure all users exist
	for (let i = 0; i < userList.length; i++) {
		if (
			userList[i] == req.user.id ||
			(await User.findById(userList[i])) == null
		)
			return res.sendStatus(400);
	}

	// Save the new chat to the database
	new Chat({ members: [req.user.id, ...userList] }).save((err) => {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		} else res.sendStatus(201);
	});
});
```

<hr>

DELETE /api/chats:<br>

Varmistaa, että pyynnössä on keskustelun ID, ja poistaa käyttäjän keskustelusta tai poistaa keskustelun, jos se jäisi tyhjäksi.

```javascript
router.delete("/chats", body("id").not().isEmpty().trim(), async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });

	const { id } = req.body;

	const chat = await Chat.findById(id);

	// If the request user is not in the chat
	if (!chat.members.includes(req.user.id)) return res.sendStatus(403);

	// If chat would be left empty, delete it completely
	if (chat.members.length <= 1) {
		Chat.findByIdAndDelete(id, (err) => {
			if (err) console.error(err);
			else res.sendStatus(200);
		});
	} else {
		// Else just remove the user from the chat
		chat.members = chat.members.filter((member) => member != req.user.id);

		chat.save((err) => {
			if (err) res.sendStatus(500);
			else res.sendStatus(200);
		});
	}
});
```

<hr>

POST /api/messages:<br>

Varmistaa, että pyynnössä on vastaanottaja ja viestin sisältö. Lisää viestin keskusteluun, johon vastaanottaja osoittaa.

```javascript
router.post(
	"/messages",
	body("recipient").not().isEmpty().trim(),
	body("message").not().isEmpty().trim(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { recipient, message } = req.body;

		// Make sure the chat exists
		let chat = await Chat.findById(recipient);
		if (chat == null) return res.sendStatus(404);

		// Save message to the database
		Chat.findByIdAndUpdate(
			recipient,
			{
				$push: {
					messages: {
						sender: req.user.id,
						content: message
					}
				}
			},
			(err) => {
				if (err) {
					console.error(err);
					res.sendStatus(500);
				} else res.sendStatus(201);
			}
		);
	}
);
```

</details>

<details><summary>routes/auth.js</summary><br>

GET /auth/register:<br>

Vastaa rekisteröintinäkymällä

```javascript
router.get("/register", (req, res) => {
	if (req.isAuthenticated()) return res.redirect("/messages");
	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});
```

<hr>

POST /auth/register:<br>

Varmistaa, että pyynnössä on käyttäjänimi ja salasana (vähimmäispituus 6 merkkiä). Luo käyttäjän tai vastaa virheviestillä, jos käyttäjänimi on jo käytössä. Bcrypt hash-algoritmia käytetään salasanoihin ennen tietokantaan tallentamista.

```javascript
router.post(
	"/register",
	// Validate request body
	body("username").not().isEmpty().trim(),
	body("password").isLength({ min: 6 }).trim(),
	async (req, res, next) => {
		// Handle any errors in request
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { username, password } = req.body;

		// Null or object
		const usernameTaken = await User.findOne({ username });

		if (usernameTaken) {
			return res.status(409).json({ message: "Username already taken" });
		}

		// Create account, save it to the database and then log the user in
		bcrypt
			.hash(password, 10)
			.then(async (hashedPassword) => {
				const user = new User({
					username,
					password: hashedPassword
				});

				await user.save();

				req.login(user, (err) => {
					if (err) {
						console.error(err);
						return next(err);
					} else return res.redirect("/profile");
				});
			})
			.catch((err) => {
				console.error(err);
				if (!res.headersSent) res.sendStatus(500);
			});
	}
);
```

<hr>

GET /auth/login:<br>

Vastaa kirjautumisnäkymällä

```javascript
router.get("/login", (req, res, next) => {
	if (req.isAuthenticated()) return res.redirect("/messages");
	return res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});
```

<hr>

POST /auth/login:<br>

Tarkistaa käyttäjän salasanan ja kirjaa käyttäjän sisään, jos se on oikein.

```javascript
router.post("/login", (req, res, next) => {
	passport.authenticate(
		"local",
		{ failWithError: true },
		(err, user, info) => {
			if (err) return next(err);
			if (!user)
				return res.status(info.status).json({ message: info.message });

			req.login(user, (err) => {
				if (err) console.error(err);
				return res.redirect("/messages");
			});
		}
	)(req, res, next);
});
```

<hr>

/auth/logout:<br>

Kirjaa käyttäjän ulos. Tätä reittiä varten kelpaa mikä tahansa pyynnön metodi (GET, POST, PUT, DELETE yms.)

```javascript
router.all("/logout", (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	req.logout((err) => {
		if (err) console.error(err);
		res.redirect("/auth/login");
	});
});
```

</details>

<details><summary>routes/root.js</summary><br>

GET /:<br>

Uudelleenohjaa käyttäjän joko kirjautumisnäkymään tai viestinäkymään riippuen siitä, onko käyttäjä kirjautunut sisään.

```javascript
router.get("/", async (req, res) => {
	if (!req.isAuthenticated()) res.redirect("/auth/login");
	else res.redirect("/messages");
});
```

<hr>

GET /profile:<br>

Vastaa profiilinäkymällä

```javascript
router.get("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});
```

<hr>

GET /messages:<br>

Vastaa viestinäkymällä

```javascript
router.get("/messages", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});
```

<hr>

PUT /profile:<br>

Muokkaa pyynnön tehneen käyttäjän käyttäjänimen ja/tai vaihtaa salasanan.

```javascript
router.put(
	"/profile",
	body("username").not().isEmpty().trim(),
	body("currentPassword").isString(),
	body("newPassword").isString(),
	async (req, res) => {
		if (!req.isAuthenticated()) return res.sendStatus(401);

		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { username, currentPassword, newPassword } = req.body;

		// Null or object
		const usernameTaken = await User.findOne({ username });

		// If username is taken by someone other than the user requesting the update
		if (usernameTaken && usernameTaken._id != req.user.id) {
			return res.status(409).json({ message: "Username already taken" });
		}

		// Get user from the database and update username and password
		User.findById(req.user.id, async (err, user) => {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			}

			user.username = username;

			// Update password
			if (currentPassword && newPassword) {
				const match = await bcrypt.compare(
					currentPassword,
					user.password
				);

				if (match) {
					user.password = await bcrypt.hash(newPassword, 10);
				} else {
					return res
						.status(403)
						.json({ message: "Incorrect password" });
				}
			}

			await user.save();

			// Login with the updated user
			req.login(user, (err) => {
				if (err) console.error(err);
				res.sendStatus(200);
			});
		});
	}
);
```

<hr>

DELETE /profile:<br>

Poistaa pyynnön tehneen käyttäjän ja kirjautuu ulos

```javascript
router.delete("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	Chat.find({ members: req.user.id }, async (err, chats) => {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		}

		// Remove user from chats
		if (chats.length) {
			for (let i = 0; i < chats.length; i++) {
				let chat = chats[i];
				if (chat.members.length > 1) {
					console.log("Removing user from chat");
					await Chat.findByIdAndUpdate(chat._id, {
						$pull: { members: req.user.id }
					});
				} else {
					console.log("Deleting chat");
					await Chat.findByIdAndDelete(chat._id);
				}
			}
		}

		const success = await User.findByIdAndDelete(req.user.id);

		if (success) {
			req.logout((err) => {
				if (err) return res.sendStatus(500);
				res.sendStatus(200);
			});
		} else res.sendStatus(500);
	});
});
```

</details>

## Tietokannan mallit

Jokaisessa tietokannan mallissa on sama periaate. Mongoose kirjaston avulla luodaan uusi malli, jossa määritetään halutut kentät. Jokaiselle kentälle määritetään tyyppi ja vaihtoehtoisesti myös määritetään se pakolliseksi

```javascript
const mongoose = require("mongoose");

const User = new mongoose.Schema({
	username: { type: String, required: true },
	password: { type: String, required: true }
});

module.exports = mongoose.model("User", User);
```

Keskusteluiden ja viestien malleissa on myös määritetty `ref` kenttä.
Tämä tarkoittaa, että tämän kentän arvo viittaa jonkin muun mallin kenttään.
Tätä voi hyödyntää myöhemmin tietokannasta hakiessa käyttämällä populate() funktiota,
jolloin esimerkiksi Chat mallin members listaan täytetään ID:n lisäksi käyttäjän muut ajantasaiset tiedot.

```javascript
const Chat = new Schema({
	members: { type: [Schema.Types.ObjectId], required: true, ref: "User" },
	messages: { type: [Message], default: [] },
	createdOn: { type: Date, default: Date.now }
});
```

## Projektissa käytetyt kirjastot

-   https (NodeJS) (https-palvelin)
-   path (NodeJS) (tiedostopolkujen luominen ilman `/` tai `\` merkkejä)
-   fs (NodeJS) (lukee SSL sertifikaattitiedostot)
-   body-parser (mahdollistaa)
-   express (kirjasto pyyntöjen käsittelyä varten)
-   express-validator (väliohjelmisto pyyntöjen tarkistukseen)
-   express-session (väliohjelmisto evästepohjaisille sessioille)
-   connect-mongodb-session (sessioiden tallennus MongoDB tietokantaan)
-   passport (väliohjelmisto autentikointiin)
-   passport-local (paikallinen (LocalStrategy) autentikointi. Muita vaihtoehtoja ovat mm. Google käyttäjällä kirjautuminen)
-   mongoose (Selkeyttää tietokannan käyttöä ja mahdollistaa mallien tekemisen)
-   bcrypt (hash-algoritmi salasanoja varten)

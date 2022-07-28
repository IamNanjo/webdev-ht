const router = require("express").Router();
const { body, validationResult } = require("express-validator");

const Chats = require("../models/Chats");

router.use((req, res, next) => next());

router.get("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	return res.json(req.user);
});

router.get("/messages", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	try {
		const chats = await Chats.find({ members: req.user.id });
	} catch (err) {
		console.error(err);
		return res.sendStatus(404);
	}

	res.json({
		chatList: [
			{ id: "1", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "2", chatName: "Pog chat", lastMsg: "Test message pog", msgList: [
			{ id: "1", sender: "You", message: "Hello!" },
			{
				id: "2",
				sender: "John Doe",
				message: `Awfully long response Lorem ipsum dolor sit amet consecteturadipisicing elit. Maiores provident tempore laboriosam,corrupti eos eius repellendus fugit sint perferendis optio quis, cum, aliquam ullam molestias tenetur deleniti fugiat
nemo ducimus quod excepturi minima reiciendis. Eos culpa
nemo impedit dolorem quidem neque laboriosam dignissimos,
repellendus tenetur amet, vitae optio iste, quod fuga.
Debitis rem officia esse facere veniam magni recusandae
voluptates in! Porro, labore aut aperiam dicta ipsum
perspiciatis explicabo nemo enim possimus temporibus
molestias iste ducimus sint, corporis esse natus et debitis
totam odit. Ducimus qui nulla voluptates possimus quidem
adipisci totam reprehenderit vitae asperiores cupiditate in
sed sit minus architecto eveniet magnam, ut mollitia facere.
Ullam omnis reprehenderit eligendi recusandae iste.
Laboriosam debitis delectus consequatur asperiores assumenda
similique nam at facere qui molestiae, minima vero
perferendis tempore autem corrupti adipisci veritatis
mollitia fugit dolor. Molestias magni nobis ullam architecto
labore sequi vel quas accusantium beatae a numquam, eveniet
in. Ullam cupiditate est, recusandae illo culpa
reprehenderit assumenda. Sit repudiandae pariatur
consectetur dicta ducimus ab unde eaque iusto dignissimos
provident nisi nostrum possimus libero maiores sed ullam
cumque praesentium qui vitae ea, odit a. Maiores voluptas,
quaerat architecto quae assumenda dolorum nihil sunt vero
asperiores itaque? Officiis repellat iusto praesentium,
dignissimos dolorum tempore temporibus odit facilis
voluptate saepe dolor a laudantium tenetur veniam illo error
minus ex, iste libero optio? Unde dolorem impedit laboriosam
voluptatum minima! Atque quam tenetur quisquam non culpa
iusto. A ullam debitis culpa magni perferendis natus velit,
doloribus eveniet consequuntur quam ducimus aut nihil quas
repellendus fugiat perspiciatis architecto aliquam minima
neque modi eos autem iure porro impedit. Provident qui
laudantium deleniti animi ipsam molestias, laborum dolorem
libero sequi voluptatem adipisci ab asperiores nulla
quaerat, quibusdam eveniet possimus ipsa reiciendis et
accusantium, totam minus ad blanditiis in! Est porro magni
dolor architecto. Magni exercitationem, ipsam error, aut
veritatis explicabo, debitis inventore perspiciatis mollitia
nostrum natus quam similique iusto? Maxime repellat nobis
ratione distinctio quae, necessitatibus dignissimos quasi
rerum ad suscipit impedit cum eos blanditiis optio obcaecati
ducimus atque officia, quidem totam esse laudantium quos. Ea
fugiat sed quo quia quod optio sunt praesentium consectetur
tempora ipsum deserunt, ratione a. Cumque nostrum, aperiam,
excepturi assumenda ipsum repellat laborum cum provident
perferendis libero quisquam non. Facilis, minus nam, aperiam
nisi nihil quibusdam nobis impedit corrupti sit, iusto quia
sunt consequuntur officia placeat! Labore, a! Deserunt
nobis, ab fuga sed doloribus ratione unde placeat enim
labore ad? Odio nulla voluptate repudiandae, nam nemo sunt
illo. Veritatis placeat laboriosam nihil repellat quod vero
tenetur consequatur quisquam laborum. Maiores eos, quia rem
nulla distinctio aliquid recusandae facere autem quae
repellendus quaerat, commodi expedita deserunt molestias
incidunt vero harum accusamus nihil in neque vitae hic error
laboriosam! Voluptatibus asperiores porro voluptatem
reprehenderit iste delectus obcaecati! Ipsa totam cumque
consequatur, reiciendis quasi officiis, numquam aliquam
dolore iste necessitatibus id qui adipisci officia
laudantium amet ad? Maxime repellendus accusantium doloribus
eaque odio perferendis veniam cum aperiam facilis natus,
molestiae saepe in dolore animi blanditiis. Quos nemo
quaerat, officiis nostrum voluptates quisquam quasi eum
itaque?`
			},
			{ id: "3", sender: "John Doe", message: "Test message pog" }
		] },
			{ id: "3", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "4", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "5", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "6", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "7", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "8", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "9", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "10", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "11", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "12", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "13", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "14", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "15", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "16", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "17", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "18", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "19", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "20", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "21", chatName: "Test chat", lastMsg: "Test message pog" },
			{ id: "22", chatName: "Test chat", lastMsg: "Test message pog" }
		]
	});
});

router.post(
	// Send message
	"/messages",
	body("recipient").not().isEmpty().trim(),
	body("message").trim(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { recipient } = req.body;
		if (Object.keys(req.body).includes("message")) {
			var { message } = req.body;
		}
	}
);

module.exports = router;

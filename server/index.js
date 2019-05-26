const http = require('http');
const SocketIO = require('socket.io');

const express = require('express')
const bodyParser = require('body-parser');

const consola = require('consola')
const {Nuxt, Builder} = require('nuxt')

const app = express();

// const server = http.createServer(app);
const server = http.Server(app);
const io = SocketIO(server);

const blockListener = require('./blockListener.js');
let publisher;

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
	// Init Nuxt.js
	const nuxt = new Nuxt(config);

	const {host, port} = nuxt.options.server;
	console.log(nuxt.options.server);

	// Build only in dev mode
	if (config.dev) {
		const builder = new Builder(nuxt);
		await builder.build();
	} else {
		await nuxt.ready();
	}

	// Give nuxt middleware to express
	app.use(nuxt.render);

	server.listen(port, () => {
		console.log(`listening on *:${port}`);
	});

	// Listen the server
	// app.listen(port, host)
	consola.ready({
		message: `Server listening on http://${host}:${port}`,
		badge: true
	});
}
start();

app.post('/api/network/:id', async (req, res) => {
	console.log(`change request to ${req.params.id}`);

	await blockListener.unsubscribe(publisher);
	publisher = await blockListener.getPublisher(req.params.id);
	blockListener.setSubscriber(io, publisher);

	res.json({msg: 'ok'});
});

app.post('/api/metamask', bodyParser.json(), (req, res) => {
	console.log(req.body);

	blockListener.setMetaMaskUserInfo(req.body);
	res.json({msg: 'ok'});
});

app.get('/ping', (req, res) => {
	console.log('got a request for API');
	res.json({
		msg: 'pong'
	});
});

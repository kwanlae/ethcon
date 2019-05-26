require('dotenv').config();

const PROVIDER = `wss://ropsten.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`;
console.log(PROVIDER.substring(0, 40));

const Web3 = require('web3');
const	web3 = new Web3(PROVIDER);

async function run() {
	let log = await web3.eth.subscribe('logs', {
		address: '0xFab46E002BbF0b4509813474841E0716E6730136'
	});

	log.on('data', log => {
		console.log(new Date());
		console.log(log);
	}).on('changed', log => {
		console.log(log);
	}).on('error', err => {
		console.error(err);
	});
}

run();

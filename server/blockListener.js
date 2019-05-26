require('dotenv').config();

const Web3 = require('web3');
let web3;

let network;
let previousBlockHeaderNumber = 0;

let metaMaskUser = {
	network: null,
	address: null
}

module.exports = {
	unsubscribe,
	getPublisher,
	setSubscriber,
	setMetaMaskUserInfo
}

function setMetaMaskUserInfo({network, address}) {
	metaMaskUser = {
		network,
		address: address.toLowerCase()
	}
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function unsubscribe(publisher) {
	if (!publisher) {
		return;
	}

	if (web3 && web3.eth) {
		web3.eth.clearSubscriptions();
		console.log('subscriptions cleared');
	}

	await publisher.unsubscribe();
	console.log('network changed');
}

function getPublisher(_network) {
	network = _network;

	const PROVIDER = (network === 'ganache') ?
		'ws://127.0.0.1:8545' :
		`wss://${network}.infura.io/ws/v3/${process.env.INFURA_PROJECT_ID}`;

	console.log(PROVIDER.substring(0, 40));

	web3 = new Web3(PROVIDER);
	previousBlockHeaderNumber = 0;

	return web3.eth.subscribe('newBlockHeaders');
}

function setSubscriber(io, publisher) {
	io.on('connection', socket => {
		console.log('SOCKET CONNECTED!');
	});

	publisher.on('data', async blockHeader => {
		console.log(blockHeader.number, previousBlockHeaderNumber);

		if (blockHeader.number != previousBlockHeaderNumber) {
			console.log(blockHeader.number, blockHeader.hash);

			const block = await retry(web3.eth.getBlock, [blockHeader.hash], 10);

			// uncomment below section for detecting ETH transfer
			// for (txHash of block.transactions) {
			// 	const tx = await web3.eth.getTransaction(txHash);

			// 	if (tx && tx.to && tx.to.toLowerCase() == metaMaskUser.address && network == metaMaskUser.network) {
			// 		const trasferMsg = {
			// 			to: tx.to,
			// 			from: tx.from,
			// 			gas: tx.gas,
			// 			gasPrice: tx.gasPrice,
			// 			value: tx.value
			// 		}
			// 		console.table(trasferMsg);

			// 		io.emit('transfer', trasferMsg);
			// 	}

			// 	if (tx && tx.to == null) {
			// 		// console.log('CONTRACT CREATED');
			// 	}
			// }

			const blockMeta = {
				network: network,
				number: blockHeader.number,
				txCount: block ? block.transactions.length : '-',
				gasUsed: blockHeader.gasUsed,
				timeStamp: new Date(blockHeader.timestamp * 1000)
			}
			console.table(blockMeta);

			io.emit('new block', blockMeta);

			previousBlockHeaderNumber = blockHeader.number;
		}
	}).on('error', err => {
		console.error(err);
	});
}

async function retry(func, arg, iter) {
	let block = null;

	for (let i = 0; i < iter; i++) {
		console.log(`retry: ${i + 1}`);

		block = await func(...arg);
		if (block) {
			return block;
			// break;
		}
	}

	return block;
}

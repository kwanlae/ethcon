<template>
	<section>
		<div class="ui secondary pointing menu">
			<a class="item" :class='{active: menu == "MM"}' @click='setMenu("MM")'>MetaMask</a>
			<a class="item" :class='{active: menu == "BE"}' @click='setMenu("BE")'>Block Explorer</a>
		</div>
		<div class="ui basic segment">
			<div v-show='menu == "MM"'>
				<h2 class="ui header">
					Current Address
					<div class="sub header">{{address}}</div>
				</h2>
				<h2 class="ui header">
					Network Version
					<div class="sub header">{{networkVersion}}</div>
				</h2>
			</div>

			<div v-show='menu == "BE"'>
				<div class="ui selection dropdown">
					<input type="hidden" name="network" @change='changeNetwork($event)'>
					<i class="dropdown icon"></i>
					<div class="default text">network</div>
					<div class="menu">
						<div class="item" data-value="mainnet">mainnet</div>
						<div class="item" data-value="ropsten">ropsten</div>
						<div class="item" data-value="rinkeby">rinkeby</div>
						<div class="item" data-value="goerli">goerli</div>
						<div class="item" data-value="kovan">kovan</div>
						<div class="item" data-value="ganache">ganache</div>
					</div>
				</div>

				<div class="ui icon message">
					<i v-if='amountInfo' class="inbox icon"></i>
					<i v-else class="notched circle loading icon"></i>

					<div class="content">
						<div class="header">Checking the {{address}} in {{networkVersion}}</div>
						<p v-if='amountInfo'>I've GOT it <b>{{amountInfo.value}}</b> from {{amountInfo.from}}.</p>
						<p v-else>Monitoring the Blockchain Inside.</p>
					</div>
				</div>
	
				<h2 class='ui header'>Block Log</h2>
				<table class="ui compact table">
					<thead>
						<tr>
							<th>network</th>
							<th>Block Number</th>
							<th>TXs Count</th>
							<th>Gas Used</th>
							<th>Timestamp</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for='(block, index) in reverseItems' :key='index'>
							<td><div class="ui mini label" :class="networkLabel(block.network)">{{block.network}}</div></td>
							<td>{{block.number.toLocaleString()}}</td>
							<td>{{block.txCount.toLocaleString()}}</td>
							<td>{{block.gasUsed.toLocaleString()}}</td>
							<td>{{block.timeStamp}}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

	</section>
</template>

<script>
import socket from '~/plugins/socket.io.js'
import networkVersion from '~/static/networkVersion.js'

export default {
	data() {
		return {
			menu: 'MM',
			address: 'loading...',
			networkVersion: 'loading...',
			newBlock: '',
			blocks: [],
			amountInfo: null
		}
	},

	components: {
	},

	beforeMount() {
		socket.on('new block', newBlock => {
			console.table(newBlock);
			
			this.newBlock = newBlock;
			this.blocks.push(newBlock);
		});

		socket.on('transfer', msg => {
			console.table(msg);

			this.amountInfo = msg;

			setTimeout(() => {
				this.amountInfo = null;
			}, 20 * 1000);

		});
	},

	async mounted() {
		if (typeof ethereum !== 'undefined') {
			const accounts = await ethereum.enable();

			this.address = accounts[0];
			this.networkVersion = networkVersion[ethereum.networkVersion];

			this.$axios.$post(`/api/metamask/`, {
				network: this.networkVersion, address: this.address
			});
		} else {
			this.address = 'N/A';
			this.networkVersion = 'N/A';
		}

		$('.ui.dropdown').dropdown('set value', this.networkVersion);
		$('.ui.dropdown').dropdown('set visible');
	},

	created() {
	},

	methods: {
		setMenu(menu) {
			this.menu = menu;
			// this.$emit('update:menu', menu);
		},

		changeNetwork(event) {
			console.log(event.target.value);
			this.$axios.$post(`/api/network/${event.target.value}`);
		},

		networkLabel(network) {
			const labelColor = {
				mainnet: 'red',
				ropsten: 'blue',
				rinkeby: 'yellow',
				goerli: 'olive',
				kovan: 'green'
			}

			return labelColor[network];
		}
	},

	computed: {
		reverseItems() {
			if (this.blocks.length > 20) {
				this.blocks.shift();
			}

			return this.blocks.slice().reverse();
		}
	},
}

</script>

<style>
[v-cloak] {display: none}

section {
	padding: 10px;
}

</style>

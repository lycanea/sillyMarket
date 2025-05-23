const { EmbedBuilder, WebhookClient, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const Chart = require('chart.js/auto');

const sillypost_cookie = process.env.sillypost_cookie;
if (!sillypost_cookie) {
	console.warn("invalid sillypost_cookie");
	process.abort();
}

const webhook_urls = process.env.webhook_urls?.split(','); // accept multiple URLs separated by commas
if (!webhook_urls || webhook_urls.length === 0) {
	console.warn("invalid webhook_urls");
	process.abort();
}

let marketPrice = 0;
const priceHistory: number[] = [];

async function getMarket() {
	const request = new Request("https://sillypost.net/games/sillyexchange", {
		method: "POST",
		body: "",
		headers: { "Cookie": sillypost_cookie },
	});

	const response = await fetch(request);
	return await response.json();
	// return { price: Math.round(Math.random() * 100) };
}

function generateGraph(prices: number[]): Buffer {
	const width = 800;
	const height = 400;
	const canvas = createCanvas(width, height);

	const labels = prices.map((_, index) => `T-${prices.length - index}`);
	const data = {
		labels,
		datasets: [
			{
				label: 'Market Price',
				data: prices,
				borderColor: 'rgba(0, 255, 255, 1)',
				backgroundColor: 'rgba(0, 255, 255, 0.2)',
				tension: 0.4,
			},
		],
	};

	new Chart(canvas.getContext('2d'), {
		type: 'line',
		data,
		options: {
			responsive: false,
			plugins: {
				legend: {
					display: true,
				},
			},
			scales: {
				x: {
					title: {
						display: true,
						text: 'Time',
					},
				},
				y: {
					title: {
						display: true,
						text: 'Price',
					},
				},
			},
		},
	});

	return canvas.toBuffer();
}

async function sendWebhook(price: string) {
	const graphBuffer = generateGraph(priceHistory);
	const attachment = new AttachmentBuilder(graphBuffer, { name: 'market_graph.png' });

	let actionMessage = '';
	const numericPrice = parseFloat(price);
	if (numericPrice <= 20) {
		actionMessage = 'BUY THAT SHIT';
	} else if (numericPrice >= 200) {
		actionMessage = 'SELL THAT SHIT';
	}

	let embed
	if (actionMessage.length > 0) {
		embed = new EmbedBuilder()
			.setTitle('Market Update: ' + price + ' beans per silly!')
			.setDescription(actionMessage)
			.setColor(0x00ffff)
			.setImage('attachment://market_graph.png');
	} else {
		embed = new EmbedBuilder()
			.setTitle('Market Update: ' + price + ' beans per silly!')
			.setColor(0x00ffff)
			.setImage('attachment://market_graph.png');
	}

	for (const url of webhook_urls) {
		const webhookClient = new WebhookClient({ url });
		await webhookClient.send({
			content: numericPrice <= 20 || numericPrice >= 200 ? '<@&1375581222994182144>' : '',
			embeds: [embed],
			files: [attachment]
		});
	}
}

let currentMarket;
try {
	currentMarket = await getMarket();
	marketPrice = currentMarket['price'];
	priceHistory.push(marketPrice);
} catch (error) {
	console.warn('Failed to fetch initial market data:', error);
}

setInterval(async () => {
	try {
		let currentMarket = await getMarket();
		if (typeof currentMarket['price'] !== 'number') {
			throw new Error("Unexpected response format: 'price' is not a number");
		}
		console.log(currentMarket['price']);
		console.log(marketPrice);
		if (currentMarket['price'] != marketPrice) {
			// Update price history
			priceHistory.push(currentMarket['price']);
			if (priceHistory.length > 20) {
				priceHistory.shift(); // Keep only the last 20 values
			}

			// Send webhook with graph
			await sendWebhook(currentMarket['price'].toString());
			marketPrice = currentMarket['price'];
		}
	} catch (error) {
		console.warn('Failed to fetch or process market data:', error);
	}
}, 10000);
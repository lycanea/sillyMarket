const { EmbedBuilder, WebhookClient } = require('discord.js');

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

async function getMarket() {
	const request = new Request("https://sillypost.net/games/sillyexchange", {
		method: "POST",
		body: "",
		headers: { "Cookie": sillypost_cookie },
	});

	const response = await fetch(request);
	return await response.json();
}

async function sendWebhook(price: string) {
	const embed = new EmbedBuilder()
		.setTitle('Market Update: ' + price + ' beans per silly!')
		.setColor(0x00FFFF);

	for (const url of webhook_urls) {
		const webhookClient = new WebhookClient({ url });
		await webhookClient.send({
			content: '',
			embeds: [embed],
		});
	}
}

let currentMarket;
try {
	currentMarket = await getMarket();
	marketPrice = currentMarket['price'];
} catch (error) {
	console.warn("Failed to fetch initial market data:", error);
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
			// price updated
			await sendWebhook(currentMarket['price'].toString());
			marketPrice = currentMarket['price'];
		}
	} catch (error) {
		console.warn("Failed to fetch or process market data:", error);
	}
}, 10000);
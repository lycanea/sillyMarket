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

let currentMarket = await getMarket();
marketPrice = currentMarket['price'];

setInterval(async () => {
	let currentMarket = await getMarket();
	console.log(currentMarket['price']);
	console.log(marketPrice);
	if (currentMarket['price'] != marketPrice) {
		// price updated
		await sendWebhook(currentMarket['price'].toString());
		marketPrice = currentMarket['price'];
	}
}, 10000);
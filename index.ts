const { EmbedBuilder, WebhookClient } = require('discord.js');

const sillypost_cookie = process.env.sillypost_cookie
if (!sillypost_cookie) {console.warn("invalid sillypost_cookie");process.abort();}
const webhook_url = process.env.webhook_url
if (!webhook_url) {console.warn("invalid webhook_url");process.abort();}

let marketPrice = 0

async function getMarket() {
	const request = new Request("https://sillypost.net/games/sillyexchange", {
		method: "POST",
		body: "",
		headers: {"Cookie": process.env.sillypost_cookie}
	});
	  
	const response = await fetch(request);
	return await response.json()
}

async function sendWebhook(price: string) {
	const webhookClient = new WebhookClient({ url: webhook_url });
	const embed = new EmbedBuilder()
		.setTitle('Market Update: ' + price + ' beans per silly!')
		.setColor(0x00FFFF);
	webhookClient.send({
		content: '',
		username: 'arf :3',
		embeds: [embed],
	});
}

let currentMarket = await getMarket()
marketPrice = currentMarket['price']

setInterval(async () => {
	let currentMarket = await getMarket()
	console.log(currentMarket['price'])
	console.log(marketPrice)
	if (currentMarket['price'] != marketPrice) {
		// price updated
		sendWebhook(currentMarket['price'].toString())
		marketPrice = currentMarket['price']
	}
}, 10000)
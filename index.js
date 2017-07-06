'use strict';
const http = require('http');
const fs = require('fs');

sat24();

function httpGetPromise(options) {
	return new Promise((resolve, reject) => http.get(options, resolve).on('error', reject));
}

function sleep(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

async function fetchImage(dateString) {
	// const url = `http://localhost:5000/image2.jpg?type=visual5&region=fr&timestamp=${dateString}`;
	const url = `http://en.sat24.com/image?type=visual5&region=fr&timestamp=${dateString}`;

	console.log(`Fetching ${url}`);
	return httpGetPromise(url);
}

async function fetchSat24Api() {
	console.log('Fetching most recent Sat24 image...');
	const dateString = getDate();
	const res = await fetchImage(dateString);
	console.log(`Fetched ! Status code is ${res.statusCode}`);

	if (res.statusCode !== 200)
		throw new Error(`Error on ${res.req.path}\n${res.statusCode} - ${res.statusMessage}`);

	res.pipe(fs.createWriteStream(`./out/${dateString}.jpg`));
}

async function sat24() {
	let retries = 0;
	while (true) {
		try {
			await fetchSat24Api();
		} catch (err) {
			console.error(err)
			if (retries < 5) {
				retries++;
				console.log('Retrying immediately');
				continue;
			}
			retries = 0;
			console.error('Retries failed: trying every minute until resolved')
			await sleep(60 * 1000);
		}

		const sleepTime = 5 * 60 * 1000;
		console.log(`Sleeping ${sleepTime} milliseconds`);
		await sleep(sleepTime);
	}
}

function getDate() {
	const date = new Date();

	const year = date.getUTCFullYear();
	const month = ('00' + (date.getUTCMonth() + 1)).slice(-2);
	const day = ('00' + date.getUTCDate()).slice(-2);
	const hour = ('00' + date.getUTCHours()).slice(-2);

	const minute = (Math.round(date.getUTCMinutes() / 5) - 1) * 5;
	const computedMinute = ('00' + minute).slice(-2);

	return `${year}${month}${day}${hour}${computedMinute}`;
}
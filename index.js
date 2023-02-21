require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");

// Import models
const NewsArticle = require("./models/NewsArticle");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

mongoose
	.connect(process.env.DATABASE_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then((result) => {
		console.log("Connected to MongoDB");
		app.listen(PORT, () => {
			console.log(`server running on port ${PORT}`);
		});
	})
	.catch((err) => console.log(err));

app.get("/", (req, res) => {
	res.send("Hello");
});

app.post("/astria", async (req, res) => {
	console.log(req.body);
	res.send(200);
});

app.post("/airtable", async (req, res) => {
	console.log(req.body);

	const { webhook } = req.body;

	if (webhook) {
		try {
			const { id } = webhook;
			if (id) {
				const response = await axios(
					`https://api.airtable.com/v0/bases/appGP1mnFM2xEp23M/webhooks/${id}/payloads`,
					{
						headers: {
							Authorization:
								"Bearer pat97FIVBH5GPYvDd.3ea6927dd578fbf342d63336bb98fe28a287a70ed51e72b9dc892264c136be76",
						},
					}
				);
				const { data } = response;
				const { payloads } = data;
				// console.log(payloads[payloads.length - 1])
				const recent_payload = payloads[payloads.length - 1];
				// console.log(recent_payload)
				// console.log(recent_payload?.changedTablesById)
				// console.log(recent_payload?.changedTablesById?.tblEt5T3bWxltFms5)
				const changedTablesById = recent_payload?.changedTablesById;
				const table = changedTablesById[Object.keys(changedTablesById)[0]];
				console.log(table);
				const changedRecordsById = table?.changedRecordsById;
				const field = changedRecordsById[Object.keys(changedRecordsById)[0]];
				console.log(field);
				const current = field.current;
				const unchanged = field.unchanged;

				if (current && unchanged) {
					const current_cellValuesByFieldId = current.cellValuesByFieldId;
					const unchanged_cellValuesByFieldId = unchanged.cellValuesByFieldId;

					const current_cellValuesByFieldId_publish =
						current_cellValuesByFieldId[
							Object.keys(current_cellValuesByFieldId)[0]
						];
					if (current_cellValuesByFieldId_publish === true) {
						const unchanged_cellValuesByFieldId_title =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[0]
							];
						const unchanged_cellValuesByFieldId_banner =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[1]
							];
						const unchanged_cellValuesByFieldId_article =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[2]
							];
						const unchanged_cellValuesByFieldId_categories =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[3]
							];
						const unchanged_cellValuesByFieldId_summary =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[4]
							];
						const unchanged_cellValuesByFieldId_link =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[5]
							];
						const unchanged_cellValuesByFieldId_timestamp =
							unchanged_cellValuesByFieldId[
								Object.keys(unchanged_cellValuesByFieldId)[6]
							];

						// console.log(current_cellValuesByFieldId_article)
						// console.log(unchanged_cellValuesByFieldId_title)
						// console.log(unchanged_cellValuesByFieldId_banner)

						const article = {
							title: unchanged_cellValuesByFieldId_title,
							banner_image: unchanged_cellValuesByFieldId_banner,
							article: JSON.stringify(unchanged_cellValuesByFieldId_article),
							categories: unchanged_cellValuesByFieldId_categories,
							summary: unchanged_cellValuesByFieldId_summary,
							link: unchanged_cellValuesByFieldId_link,
							timestamp: unchanged_cellValuesByFieldId_timestamp,
						};

						console.log(article);
						console.log("PUBLISH  ");
						const newsArticle = new NewsArticle(article);
						await newsArticle.save();

						try {
							const clevertap_response = await axios.post(
								`https://api.clevertap.com/1/targets/create.json`,
								{
									name: article.title,
									target_mode: "push",
									where: {},
									send_to_all_devices: true,
									content: {
										title: article.title,
										body: article.summary,
										platform_specific: {
											android: {
												wzrk_cid: "AssetTest",
												default_sound: true,
												background_image: article.banner_image,
												deep_link: "asset://news",
											},
										},
									},
									devices: ["android"],
									notification_tray_priority: "max",
									delivery_priority: "high",
									when: "now",
								},
								{
									headers: {
										"X-CleverTap-Account-Id": "TEST-9RK-766-576Z",
										"X-CleverTap-Passcode":
											"7eb5836d-5d62-4651-aca9-f5c0cf7245a1",
										"Content-Type": "application/json",
									},
								}
							);
							const clevertap_data = clevertap_response.data;
							console.log("CLEVERTAP ", clevertap_data);
						} catch (er) {
							console.log(er);
						}

						res.status(200).send(newsArticle);
					} else {
						console.log("NOT TO PUBLISH!");
					}
				} else {
					console.log("Third no current or unchanged");
					res.status(400).send("Bad Request");
				}
			} else {
				console.log("First no id");
				res.status(400).send("Bad Request");
			}
		} catch (err) {
			console.log(err);
			res.status(500).send("Internal Server Error");
		}
	} else {
		console.log("Second no webhook");
		res.status(400).send("Bad Request");
	}
});

// app.listen(PORT, () => {
//   console.log(`server running on port ${PORT}`)
// })

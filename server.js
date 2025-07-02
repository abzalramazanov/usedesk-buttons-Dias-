const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("."));

const PORT = process.env.PORT || 3000;

app.post("/create-ticket", async (req, res) => {
  const {
    subject, message, client_phone, tag, user_id
  } = req.body;

  if (!subject || !message) {
    return res.send("❌ Subject и Message обязательны");
  }

  try {
    const response = await axios.post("https://api.usedesk.ru/create/ticket", {
      api_token: process.env.API_TOKEN,
      subject,
      message,
      client_phone,
      channel_id: 66235,
      from: "user"
    });

    console.log("✅ Ответ:", response.data);
    res.send(`✅ Тикет создан! ID: ${response.data.ticket_id || response.data.ticket?.id}`);
  } catch (error) {
    console.error("❌ Ошибка:", error.response?.data || error.message);
    res.send("❌ Ошибка при создании тикета");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("."));

const PORT = process.env.PORT || 3000;

app.post("/create-ticket", async (req, res) => {
  const {
    subject, message, client_id, tag, client_phone, user_id
  } = req.body;

  try {
    // 1. Создаём тикет
    const ticketResponse = await axios.post("https://api.usedesk.ru/create/ticket", {
      api_token: process.env.API_TOKEN,
      subject: subject,
      client_id: client_id,
      tag: tag
    });

    const ticket_id = ticketResponse.data.ticket_id;

    // 2. Добавляем комментарий от user
    await axios.post("https://api.usedesk.ru/create/comment", {
      api_token: process.env.API_TOKEN,
      ticket_id: ticket_id,
      message: message,
      from: "user",
      user_id: user_id
    });

    res.send(`✅ Тикет создан! ID: ${ticket_id}`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("❌ Ошибка при создании тикета");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
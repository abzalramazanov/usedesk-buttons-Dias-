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
    subject,
    message,
    client_phone,
    tag,
    user_id,
    status
  } = req.body;

  if (!subject || !message) {
    return res.send("❌ Subject и Message обязательны");
  }

  // Разделяем номера по запятой
  const phones = client_phone
    .split(",")
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const results = [];

  for (const phone of phones) {
    try {
      const response = await axios.post("https://api.usedesk.ru/create/ticket", {
        api_token: process.env.API_TOKEN,
        subject,
        message,
        client_phone: phone,
        channel_id: 66235,
        from: "user",
        status: Number(status),
        tag
      });

      const ticket_id = response.data.ticket_id || response.data.ticket?.id;
      results.push(`✅ ${phone}: тикет ID ${ticket_id}`);
    } catch (error) {
      const err = error.response?.data?.error || error.message;
      results.push(`❌ ${phone}: ошибка — ${err}`);
    }
  }

  // Отдаём результат на одной странице
  res.send(results.join("<br>"));
});

app.post("/create-client", async (req, res) => {
  const { name, phone, email } = req.body;

  try {
    const response = await axios.post("https://api.usedesk.ru/create/client", {
      api_token: process.env.API_TOKEN,
      name,
      phone,
      email
    });

    console.log("✅ Клиент создан:", response.data);
    res.send(`✅ Клиент создан! ID: ${response.data.client_id}`);
  } catch (error) {
    console.error("❌ Ошибка создания клиента:", error.response?.data || error.message);
    res.send("❌ Ошибка при создании клиента");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

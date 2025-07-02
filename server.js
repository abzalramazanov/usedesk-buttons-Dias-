const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(express.static("."));

const PORT = process.env.PORT || 3000;

// ✅ Создание тикетов (мультиномер)
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

  res.send(results.join("<br>"));
});

// ✅ Создание клиента
app.post("/create-client", async (req, res) => {
  const { name, emails, note, phone } = req.body;

  try {
    const response = await axios.post("https://api.usedesk.ru/create/client", {
      api_token: process.env.API_TOKEN,
      name,
      emails,
      note,
      phone
    });

    const clientId = response.data.client?.id;
    if (clientId) {
      res.send(`✅ Клиент создан! ID: ${clientId}`);
    } else {
      res.send("⚠️ Клиент создан, но ID не найден в ответе");
    }
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при создании клиента: " + err);
  }
});

// ✅ Обновление клиента
app.post("/update-client", async (req, res) => {
  const { client_id, name, emails, position, note } = req.body;

  try {
    await axios.post("https://api.usedesk.ru/update/client", {
      api_token: process.env.API_TOKEN,
      client_id,
      name,
      emails,
      position,
      note,
      is_new_note: "true"
    });

    res.send("✅ Клиент обновлён");
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при обновлении клиента: " + err);
  }
});

// ✅ Поиск клиента
app.post("/search-client", async (req, res) => {
  const { query, search_type } = req.body;

  try {
    const response = await axios.post("https://api.usedesk.ru/clients", {
      api_token: process.env.API_TOKEN,
      query,
      search_type
    });

    const clients = response.data.clients;
    if (!clients || clients.length === 0) {
      return res.send("⚠️ Ничего не найдено");
    }

    const list = clients.map(c =>
      `ID: ${c.id}, Имя: ${c.name || "-"}, Email: ${c.emails?.join(", ") || "-"}, Тел: ${c.phone || "-"}`
    );

    res.send("🔍 Найдено:<br>" + list.join("<br>"));
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при поиске: " + err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

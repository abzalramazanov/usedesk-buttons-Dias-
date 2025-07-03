const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("."));

const PORT = process.env.PORT || 3000;

// ✅ Создание тикета
app.post("/create-ticket", async (req, res) => {
  const { subject, message, client_phone, tag, user_id, status } = req.body;

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
      emails: emails ? [emails] : [],
      note,
      phone
    });

    const clientId = response.data.client_id || response.data.client?.id;

    if (clientId) {
      res.send(`✅ Клиент создан! ID: ${clientId}<br>
        Имя: ${name || "-"}<br>
        Email: ${emails || "-"}<br>
        Телефон: ${phone || "-"}<br>
        Заметки: ${note || "-"}`);
    } else {
      res.send("⚠️ Клиент создан, но ID не получен.");
    }

  } catch (error) {
    const errData = error.response?.data;
    if (errData?.error) {
      const formatted = Object.entries(errData.error)
        .map(([field, msg]) => `❌ ${field}: ${msg.join(", ")}`)
        .join("<br>");
      return res.send(formatted);
    }

    const err = errData?.error || error.message;
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
      emails: emails ? [emails] : [],
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

// ✅ Поиск клиента (табличный вывод)
app.post("/search-client", async (req, res) => {
  let { query } = req.body;
  query = String(query || "").replace(/[^0-9]/g, "");

  try {
    const response = await axios.post("https://api.usedesk.ru/clients", {
      api_token: process.env.API_TOKEN,
      query,
      search_type: "partial_match"
    });

    let clients = response.data.clients;
    if (!clients && Array.isArray(response.data)) {
      clients = response.data;
    }

    if (!clients || clients.length === 0) {
      return res.send("⚠️ Ничего не найдено");
    }

    const tableHTML = clients.map(c => {
      const ticketList = c.tickets?.length
        ? `<ul style="margin:0; padding-left:20px; max-height:150px; overflow-y:auto;">${c.tickets.map(t => `<li>${t}</li>`).join("")}</ul>`
        : "-";

      return `
        <table border="1" cellpadding="5" cellspacing="0" style="margin-bottom: 20px; border-collapse: collapse; width: 100%; max-width: 700px;">
          <tr><th style="text-align:left;">ID</th><td>${c.id}</td></tr>
          <tr><th style="text-align:left;">Имя</th><td>${c.name || "-"}</td></tr>
          <tr><th style="text-align:left;">Телефон</th><td>${c.phone || "-"}</td></tr>
          <tr><th style="text-align:left;">Email</th><td>${(c.emails && c.emails.join(", ")) || "-"}</td></tr>
          <tr><th style="text-align:left;">Тикеты</th><td>${ticketList}</td></tr>
        </table>
      `;
    }).join("");

    res.send(`<div>🔍 Найдено клиентов: ${clients.length}</div><br>${tableHTML}`);
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при поиске: " + err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

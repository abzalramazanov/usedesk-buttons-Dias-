const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("."));

// ✅ Создание тикета
app.post("/create-ticket", async (req, res) => {
  const { subject, message, client_phone, tag, user_id, status, message_type } = req.body;

  if (!subject || !message) {
    return res.send("❌ Subject и Message обязательны");
  }

  const phones = client_phone
    .split(",")
    .map(p => p.replace(/[^0-9]/g, "").replace(/^8/, "7").replace(/^(\+7)/, "7").trim())
    .filter(p => p.length > 0);

  const results = [];

  for (const phone of phones) {
    try {
      const payload = {
        api_token: process.env.API_TOKEN,
        subject,
        message,
        client_phone: phone,
        channel_id: 66235,
        from: "user",
        status: Number(status),
        tag,
        assignee_id: user_id,
      };

      if (message_type === "private") {
        payload.private_comment = "true";
      }

      const response = await axios.post("https://api.usedesk.ru/create/ticket", payload);

      const ticket_id = response.data.ticket_id || response.data.ticket?.id;
      const link = `https://secure.usedesk.ru/tickets/${ticket_id}`;
      results.push(`✅ ${phone}: <a href="${link}" target="_blank">тикет ID ${ticket_id}</a>`);
    } catch (error) {
      const err = error.response?.data?.error || error.message;
      results.push(`❌ ${phone}: ошибка — ${err}`);
    }
  }

  res.send(results.join("<br>"));
});

// ✅ Поиск клиента
app.post("/search-client", async (req, res) => {
  let { query } = req.body;
  query = String(query || "").replace(/[^0-9]/g, "").replace(/^8/, "7");
  console.log("🔍 Поиск по:", query);

  try {
    const response = await axios.post("https://api.usedesk.ru/clients", {
      api_token: process.env.API_TOKEN,
      query,
      search_type: "partial_match"
    });

    console.log("📦 Ответ от UseDesk:", JSON.stringify(response.data, null, 2));

    const clients = Array.isArray(response.data) ? response.data : response.data.clients;
    if (!clients || clients.length === 0) {
      return res.send("⚠️ Ничего не найдено");
    }

    const list = clients.map(c => {
      const clientLink = `https://secure.usedesk.ru/clients/details/${c.id}`;
      const tickets = (c.tickets || [])
        .map(t => `<a href="https://secure.usedesk.ru/tickets/${t}" target="_blank">${t}</a>`)
        .join(", ");
      return `
        <div style="margin-bottom: 20px;">
          <a href="${clientLink}" target="_blank">ID: ${c.id}</a><br>
          Имя: ${c.name || "-"}<br>
          Email: ${c.emails?.join(", ") || "-"}<br>
          Тел: ${c.phone || "-"}<br>
          Тикеты: ${tickets}
        </div>
      `;
    });

    res.send("🔍 Найдено:<br><br>" + list.join(""));
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при поиске: " + err);
  }
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
      phone: phone?.replace(/[^0-9]/g, "").replace(/^8/, "7")
    });

    const clientId = response.data.client_id || response.data.client?.id;
    if (clientId) {
      const link = `https://secure.usedesk.ru/clients/details/${clientId}`;
      res.send(`✅ Клиент создан! <a href="${link}" target="_blank">ID: ${clientId}</a><br>
        Имя: ${name || "-"}<br>
        Email: ${emails || "-"}<br>
        Телефон: ${phone || "-"}<br>
        Заметки: ${note || "-"}`);
    } else {
      res.send("⚠️ Клиент создан, но ID не получен.");
    }
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при создании клиента: " + err);
  }
});

// ✅ Обновление клиента
app.post("/update-client", async (req, res) => {
  const { client_id, name, emails, phone, note } = req.body;

  try {
    await axios.post("https://api.usedesk.ru/update/client", {
      api_token: process.env.API_TOKEN,
      client_id,
      name,
      emails: emails ? [emails] : [],
      phone: phone?.replace(/[^0-9]/g, "").replace(/^8/, "7"),
      note,
      is_new_note: "true"
    });

    res.send("✅ Клиент обновлён");
  } catch (error) {
    const err = error.response?.data?.error || error.message;
    res.send("❌ Ошибка при обновлении клиента: " + err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});

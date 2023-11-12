import express from "express";
import { customAlphabet } from "nanoid";
import { readFile, writeFile, access } from "fs/promises";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const generateId = customAlphabet(
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8
);

const dataPath = path.join("jsonStore.json");

async function ensureDataFile() {
  try {
    await access(dataPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(dataPath, "{}");
      console.log("Data file created.");
    } else {
      throw error;
    }
  }
}

ensureDataFile();

let urlStore = {};

async function loadUrlStore() {
  try {
    const fileData = await readFile(dataPath, "utf-8");
    urlStore = JSON.parse(fileData);
  } catch (error) {
    console.error("Error loading URL store:", error.message);
  }
}

async function saveUrlStore() {
  try {
    await writeFile(dataPath, JSON.stringify(urlStore, null, 2));
  } catch (error) {
    console.error("Error saving URL store:", error.message);
  }
}

app.use(express.json());

app.post("/", (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl || typeof originalUrl !== "string") {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const shortId = generateId();
  const shortUrl = `http://localhost:${PORT}/${shortId}`;

  urlStore[shortId] = originalUrl;
  saveUrlStore();

  res.json({ shortUrl });
});

app.get("/:shortId", (req, res) => {
  const { shortId } = req.params;
  const originalUrl = urlStore[shortId];

  if (originalUrl) {
    return res.redirect(originalUrl);
  }

  res.status(404).json({ error: "URL not found" });
});

app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  await loadUrlStore();
});

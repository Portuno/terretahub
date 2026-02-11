/**
 * Avatar API - Servidor Express
 * Endpoints: GET /avatar/:userId, GET /element/:userId, GET /styles, GET /styles/:element
 */

import express from 'express';
import { getElementForUser } from './lib/elements.js';
import { getStyleForUser, listStyles } from './lib/styles.js';
import { getAvatarUrl } from './lib/avatar.js';
import {
  getCachedAvatarResponse,
  setCachedAvatarResponse,
  getCachedElement,
  setCachedElement,
} from './lib/cache.js';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.AVATAR_API_KEY;

const ELEMENTS = ['earth', 'water', 'fire', 'air'];

const requireApiKey = (req, res, next) => {
  if (!API_KEY) return next();
  const key = req.headers['x-api-key'] || req.query.apiKey;
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  next();
};

app.use(express.json());
app.use(requireApiKey);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'avatar-api' });
});

app.get('/element/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  let element = getCachedElement(userId);
  if (element == null) {
    element = getElementForUser(userId);
    setCachedElement(userId, element);
  }
  res.json({ element });
});

app.get('/avatar/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  let cached = getCachedAvatarResponse(userId);
  if (cached) {
    return res.json(cached);
  }
  const element = getElementForUser(userId);
  const style = getStyleForUser(userId, element);
  const avatarUrl = getAvatarUrl(userId, element);
  const response = {
    avatarUrl,
    element,
    styleId: style?.id ?? null,
    styleName: style?.name ?? null,
  };
  setCachedAvatarResponse(userId, response);
  res.json(response);
});

app.get('/styles', (req, res) => {
  const element = req.query.element;
  const styles = listStyles(element);
  res.json({ styles });
});

app.get('/styles/:element', (req, res) => {
  const element = req.params.element;
  if (!ELEMENTS.includes(element)) {
    return res.status(400).json({ error: 'Invalid element', valid: ELEMENTS });
  }
  const styles = listStyles(element);
  res.json({ styles });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Avatar API listening on port ${PORT}`);
});

/**
 * Nexora — MQTT WebSocket Client (Singleton)
 *
 * Connects to HiveMQ Cloud over WSS.
 * All components import from here for pub/sub.
 */

"use client";

import mqtt, { MqttClient, IClientOptions } from "mqtt";

// ── Config ───────────────────────────────────────────────────────────────────

const BROKER_URL = process.env.NEXT_PUBLIC_HIVEMQ_WS_URL!;
const BROKER_USERNAME = process.env.NEXT_PUBLIC_HIVEMQ_USERNAME;
const BROKER_PASSWORD = process.env.NEXT_PUBLIC_HIVEMQ_PASSWORD;

// ── Singleton ────────────────────────────────────────────────────────────────

let client: MqttClient | null = null;
let connected = false;
const subscribers = new Map<string, Set<(payload: unknown) => void>>();

// ── Connect ──────────────────────────────────────────────────────────────────

export function getMQTTClient(): MqttClient {
  if (client && connected) return client;

  if (client) return client; // connecting in progress

  const clientId = `nexora-web-${Math.random().toString(16).slice(2, 8)}`;

  const options: IClientOptions = {
    clientId,
    username: BROKER_USERNAME,
    password: BROKER_PASSWORD,
    clean: true,
    keepalive: 30,
    reconnectPeriod: 3000,
    connectTimeout: 15000,
    resubscribe: true,
  };

  client = mqtt.connect(BROKER_URL, options);

  client.on("connect", () => {
    connected = true;
    console.log("[MQTT] ✅ Connected to", BROKER_URL);
    // Re-subscribe all active topics
    subscribers.forEach((_, topic) => client!.subscribe(topic));
  });

  client.on("message", (topic, payload) => {
    const data = tryParse(payload.toString());
    const subs = subscribers.get(topic);
    if (subs) subs.forEach((cb) => cb(data));
  });

  client.on("error", (err) => {
    console.warn("[MQTT] ❌ Error:", err.message);
  });

  client.on("close", () => {
    connected = false;
  });

  client.on("reconnect", () => {
    console.log("[MQTT] 🔄 Reconnecting...");
  });

  return client;
}

// ── Subscribe ────────────────────────────────────────────────────────────────

export function subscribeToQueue(
  sessionId: string,
  onMessage: (topic: string, payload: unknown) => void
): () => void {
  const topicPattern = `nexora/${sessionId}/#`;
  const c = getMQTTClient();

  const handler = (receivedTopic: string, rawPayload: Buffer) => {
    if (receivedTopic.startsWith(`nexora/${sessionId}/`)) {
      onMessage(receivedTopic, tryParse(rawPayload.toString()));
    }
  };

  c.subscribe(topicPattern);
  c.on("message", handler);

  return () => {
    c.off("message", handler);
    c.unsubscribe(topicPattern);
  };
}

export function mqttSubscribe(
  topic: string,
  callback: (data: unknown) => void
): () => void {
  if (!subscribers.has(topic)) subscribers.set(topic, new Set());
  subscribers.get(topic)!.add(callback);

  const c = getMQTTClient();
  if (c.connected) c.subscribe(topic);

  return () => {
    subscribers.get(topic)?.delete(callback);
  };
}

// ── Publish ──────────────────────────────────────────────────────────────────

export function mqttPublish(
  topic: string,
  payload: object | string = {}
): void {
  const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
  const c = getMQTTClient();
  if (!c.connected) {
    console.warn("[MQTT] Not connected, cannot publish to", topic);
    return;
  }
  c.publish(topic, msg);
}

// ── Status ───────────────────────────────────────────────────────────────────

export function isMqttConnected(): boolean {
  return connected;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tryParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

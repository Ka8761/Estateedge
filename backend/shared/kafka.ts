import { Kafka, Producer, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { KafkaMessage, KafkaTopic } from './types';

const KAFKA_ENABLED = process.env.KAFKA_ENABLED !== 'false';

const kafka = KAFKA_ENABLED ? new Kafka({
  clientId: process.env.SERVICE_NAME ?? 'estateedge-service',
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  logLevel: process.env.NODE_ENV === 'production' ? logLevel.WARN : logLevel.ERROR,
  retry: {
    initialRetryTime: 300,
    retries: 3,                    // Reduced from 10 — fail fast in dev
  },
}) : null;

// ─── Producer ─────────────────────────────────────────────────────────────────

let producer: Producer | null = null;
let producerConnecting = false;

export async function getProducer(): Promise<Producer | null> {
  if (!kafka) return null;
  if (producer) return producer;
  if (producerConnecting) return null;

  producerConnecting = true;
  try {
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producer.connect();
    console.log('[Kafka] Producer connected');
    producerConnecting = false;
    return producer;
  } catch (err) {
    producerConnecting = false;
    producer = null;
    throw err;
  }
}

export async function publishEvent<T>(
  topic: KafkaTopic,
  payload: T,
  key?: string
): Promise<void> {
  if (!KAFKA_ENABLED) {
    console.log(`[Kafka DISABLED] Would publish to ${topic}:`, payload);
    return;
  }

  const message: KafkaMessage<T> = {
    eventId: uuidv4(),
    topic,
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    const prod = await getProducer();
    if (!prod) {
      console.warn(`[Kafka] Producer not available — dropping event to ${topic}`);
      return;
    }

    await prod.send({
      topic,
      messages: [
        {
          key: key ?? uuidv4(),
          value: JSON.stringify(message),
          headers: {
            'content-type': 'application/json',
            'service-name': process.env.SERVICE_NAME ?? 'unknown',
          },
        },
      ],
    });

    console.log(`[Kafka] Published to ${topic}`, { eventId: message.eventId });
  } catch (err) {
    // Never crash a service because Kafka is down — just warn and continue
    console.warn(`[Kafka] Failed to publish to ${topic} — event dropped:`, (err as Error).message);
  }
}

// ─── Consumer ─────────────────────────────────────────────────────────────────

export interface ConsumerConfig {
  groupId: string;
  topics: KafkaTopic[];
  handler: (message: KafkaMessage) => Promise<void>;
}

export async function startConsumer(config: ConsumerConfig): Promise<Consumer | null> {
  if (!KAFKA_ENABLED || !kafka) {
    console.log(`[Kafka DISABLED] Skipping consumer for group: ${config.groupId}`);
    console.log(`[Kafka DISABLED] Topics that would be consumed: ${config.topics.join(', ')}`);
    return null;
  }

  // FIX: declare consumer inside function scope (was the original bug)
  let consumer: Consumer | null = null;

  try {
    consumer = kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();
    await consumer.subscribe({ topics: config.topics, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          if (!message.value) return;
          const parsed: KafkaMessage = JSON.parse(message.value.toString());
          console.log(`[Kafka] Received from ${topic}:${partition}`, {
            eventId: parsed.eventId,
          });
          await config.handler(parsed);
        } catch (err) {
          console.error(`[Kafka] Error processing message from ${topic}`, err);
        }
      },
    });

    console.log(`[Kafka] Consumer listening on: ${config.topics.join(', ')}`);
    return consumer;
  } catch (err) {
    // Consumer failed to start — log and continue, don't crash the service
    console.warn(`[Kafka] Consumer failed to start for group ${config.groupId}:`, (err as Error).message);
    console.warn('[Kafka] Service will run without event consumption. Start Kafka to enable.');
    return null;
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect().catch(() => {});
    producer = null;
  }
  console.log('[Kafka] Disconnected');
}

process.on('SIGTERM', disconnectKafka);
process.on('SIGINT', disconnectKafka);

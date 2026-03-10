import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "user.created": {
        const { id, email_addresses, first_name, username, image_url } =
          event.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          return new Response("User has no email address", { status: 400 });
        }

        await prisma.user.create({
          data: {
            id,
            email,
            name: first_name || username || email.split("@")[0],
            avatarUrl: image_url,
          },
        });

        break;
      }

      case "user.updated": {
        const { id, email_addresses, first_name, username, image_url } =
          event.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          return new Response("User has no email address", { status: 400 });
        }

        await prisma.user.update({
          where: { id },
          data: {
            email,
            name: first_name || username || email.split("@")[0],
            avatarUrl: image_url,
          },
        });

        break;
      }

      case "user.deleted": {
        const { id } = event.data;

        if (!id) {
          return new Response("Missing user id", { status: 400 });
        }

        await prisma.user.delete({
          where: { id },
        });

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook event "${event.type}":`, err);
    return new Response("Internal server error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

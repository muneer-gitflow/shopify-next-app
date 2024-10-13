import { verifyRequest } from "@/lib/shopify/verify";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Helper function to serialize BigInt
function serializeBigInt(data: any): any {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET(req: Request) {
  try {
    const headersList = headers();
    const shop = headersList.get('x-shop-domain');

    if (!shop) {
      return NextResponse.json({ status: "error", message: "Shop header is required" }, { status: 400 });
    }

    // Fetch the session for the specific shop
    const session = await prisma.session.findFirst({
      where: {
        shop: shop
      },
      select: {
        id: true,
        accessToken: true,
        shop: true,
        isOnline: true,
        scope: true,
      }
    });

    if (!session) {
      return NextResponse.json({ status: "error", message: "No session found for this shop" }, { status: 404 });
    }

    const serializedSession = serializeBigInt(session);

    return NextResponse.json({
      status: "success",
      data: serializedSession,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { status: "error", message: "An error occurred while fetching the session" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

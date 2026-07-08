import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import GiftVoucherCard from "@/components/GiftVoucherCard";
import type { GiftVoucherDTO } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A Sweet Gift For You 💖 | BenChimin Cafe",
};

export const dynamic = "force-dynamic";

export default async function GiftVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order || !order.isGift) {
    notFound();
  }

  const voucher: GiftVoucherDTO = {
    orderId: order.id,
    shortCode: `#${order.id.slice(0, 8).toUpperCase()}`,
    fromName: order.customerName,
    toName: order.giftRecipientName ?? "",
    message: order.giftMessage,
    redeemed: order.giftRedeemed,
    items: order.items.map((item) => ({
      nameEn: item.product.nameEn,
      nameKh: item.product.nameKh,
      quantity: item.quantity,
    })),
  };

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "https://my-khmer-coffee-shop.vercel.app";
  const shareUrl = `${origin}/gift/${order.id}`;

  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 300,
    margin: 1,
    color: { dark: "#4A2C11", light: "#FFFDF9" },
  });

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-12">
      <GiftVoucherCard
        voucher={voucher}
        qrDataUrl={qrDataUrl}
        shareUrl={shareUrl}
        showShareActions
      />
    </div>
  );
}

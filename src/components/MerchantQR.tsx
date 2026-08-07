"use client";

import { QRCodeCanvas } from "qrcode.react";

/**
 * The merchant dashboard's QR code, rendered for the marketing
 * showcase. A real, scannable code — the same component the product
 * prints on its counter cards.
 */
export default function MerchantQR({
  value,
  size = 168,
}: {
  value: string;
  size?: number;
}) {
  return <QRCodeCanvas value={value} size={size} level="M" />;
}

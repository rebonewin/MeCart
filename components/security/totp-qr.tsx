"use client";

import { QRCodeSVG } from "qrcode.react";

export function TotpQr({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="inline-flex rounded-2xl bg-white p-3 shadow-lg shadow-indigo-900/10">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={1}
        bgColor="#ffffff"
        fgColor="#0f172a"
        title="Scan this QR code with your authenticator app"
      />
    </div>
  );
}

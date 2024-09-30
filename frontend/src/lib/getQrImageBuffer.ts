import QRCodeStyling, { type Options } from 'qr-code-styling'

export async function getQrImageBufferBlackAndWhite(text: string, qrOptions: Options) {
  const qrCode = new QRCodeStyling({
    ...qrOptions,
    width: 500,
    height: 500,
    type: "svg",
    data: text,
    qrOptions: {
      errorCorrectionLevel: "H",
    },
    dotsOptions: {
      ...qrOptions.dotsOptions,
      color: "#000000",
    },
    backgroundOptions: {
      ...qrOptions.backgroundOptions,
      color: "#FFFFFF",
    },
  })

  const qrCodeBuffer = await qrCode.getRawData("webp")
  if (!qrCodeBuffer) {
    throw new Error("QR code buffer is null")
  }
  return qrCodeBuffer
}
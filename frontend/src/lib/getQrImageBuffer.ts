import QRCodeStyling, { type Options } from 'qr-code-styling'

export async function getQrImageBufferBlackAndWhite(qrOptions: Options) {
  const qrCode = new QRCodeStyling({
    ...qrOptions,
    width: qrOptions.width || 500,
    height: qrOptions.height || 500,
    type: "svg",
    data: qrOptions.data,
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
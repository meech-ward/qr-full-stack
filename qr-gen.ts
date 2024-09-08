import qr from "qrcode";
import sharp, { type Blend } from "sharp";

export async function generateQRCode(text: string, imageBuffer: ArrayBuffer, outputPath: string) {
  
  const qrCodeBuffer = await qr.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "H",
    scale: 10,
  });
  
  const image = sharp(imageBuffer);

  // Get the dimensions of the QR code
  const qrCodeMetadata = await sharp(qrCodeBuffer).metadata();
  const qrCodeWidth = qrCodeMetadata.width!;
  const qrCodeHeight = qrCodeMetadata.height!;

  // Resize and process the input image
  const processedImage = await image
    .resize(qrCodeWidth, qrCodeHeight, { fit: "cover" })
    .toBuffer();
  const processedImageBuffer = await sharp(processedImage)
    // .greyscale()
    .composite([
      {
        input: Buffer.from([255, 255, 255, 150]),
        raw: {
          width: 1,
          height: 1,
          channels: 4,
        },
        tile: true,
        blend: "over",
      },
    ])
    .toBuffer();

  // Create a mask from the QR code
  const qrCodeMask = await sharp(qrCodeBuffer)
    .ensureAlpha()
    // .negate()
    .threshold(128)
    .toBuffer();

  // await sharp(qrCodeMask).toFile(outputFile);

  const blends = [
    "clear",
    "source",
    "over",
    "in",
    "out",
    "atop",
    "dest",
    "dest-over",
    "dest-in",
    "dest-out",
    "dest-atop",
    "xor",
    "add",
    "saturate",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "colour-dodge",
    "color-burn",
    "colour-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
  ];

  // for (const blend of blends) {
  const qrMaskedLight = await sharp(processedImage)
    // .ensureAlpha()
    // .joinChannel(qrCodeMask)
    .composite([
      {
        input: qrCodeMask,
        blend: "add",
      },
    ])
    .png()
    .toBuffer();

  const outputFileNames = [];

  await sharp(qrMaskedLight).toFile(`${outputPath}-${"normal"}.png`);
  outputFileNames.push({
    name: `${outputPath}-${"normal"}.png`,
    blend: "normal",
  });

  const qrMasked = await sharp(processedImage)
    .modulate({ brightness: 0.7 }) // Darken the image by reducing brightness to 70%
    // .ensureAlpha()
    // .joinChannel(qrCodeMask)
    .composite([
      {
        input: qrCodeMask,
        blend: "add",
      },
    ])
    .png()
    .toBuffer();

  await sharp(qrMasked).toFile(`${outputPath}-${"dark"}.png`);
  outputFileNames.push({
    name: `${outputPath}-${"dark"}.png`,
    blend: "dark",
  });

  for (const blend of [
    "multiply",
    "exclusion",
    "color-burn",
    "hard-light",
  ] as Blend[]) {
    const final = await sharp(processedImageBuffer)
      .composite([
        {
          input: qrMasked,
          blend: blend, // exclusion, burn, hard-light, in, multiply
        },
      ])
      .toBuffer();

    await sharp(final).toFile(`${outputPath}-${blend}.png`);
    outputFileNames.push({
      name: `${outputPath}-${blend}.png`,
      blend: blend,
    });
  }
  return outputFileNames;
}

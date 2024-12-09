import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { useEffect, useState } from "react";
import QRCodeStyling, { type Options } from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
interface QRCodeCardProps {
  title: string;
  className?: string;
  qrOptions?: Options;
  onSave?: () => void;
  loading?: boolean;
}

interface TextQRCodeCardProps extends QRCodeCardProps {
  text: string;
}

interface ImageQRCodeCardProps extends QRCodeCardProps {
  image: string;
}

function BaseQRCodeCard({ title, className, onSave, src, loading }: QRCodeCardProps & { src: string, loading?: boolean }) {
  return (
    <CardContainer className={cn(className)}>
      <CardBody className="bg-popover relative group/card dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-white overflow-hidden w-full truncate mb-4"
        >
          {title}
        </CardItem>
        <CardItem translateZ="100" className="w-full aspect-square">
          <div className="w-full h-full flex items-center justify-center bg-clear">
            {src ? (
              <img src={src} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-clear">

              </div>
            )}
            {
              loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 w-full h-full">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                </div>
              )
            }
          </div>
        </CardItem>
        <div className="flex justify-between items-center mt-8">
          <CardItem
            className="w-full flex flex-col gap-y-4"
            translateZ={20}
          >
            <Button
              variant="default"
              className="w-full"
              disabled={!src || loading}
              onClick={() => {
                if (!src) return;
                const link = document.createElement('a');
                link.href = src;
                link.download = 'qr-code.webp';
                link.click();
              }}
            >
              Download QR Code
            </Button>
            {onSave && (
              <Button
                variant="default"
                className="w-full"
                disabled={!src || loading}
                onClick={onSave}
              >
                Save QR Code
              </Button>
            )}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}

export function TextQRCodeCard({ text, qrOptions, loading, ...props }: TextQRCodeCardProps) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    if (!text) {
      setSrc('')
      return;
    }

    const qrCode = new QRCodeStyling({
      ...qrOptions,
      data: text,
    });
    qrCode.getRawData("webp").then((buffer) => {
      if (!buffer) return;
      const blob = new Blob([buffer], { type: 'image/webp' });
      setSrc(URL.createObjectURL(blob));
    });
  }, [text, qrOptions]);

  return <BaseQRCodeCard {...props} src={src} loading={loading} />;
}

export function ImageQRCodeCard({ image, loading, ...props }: ImageQRCodeCardProps) {
  return <BaseQRCodeCard {...props} src={image} loading={loading} />;
}

// For backwards compatibility
export const QRCodeCard = TextQRCodeCard;
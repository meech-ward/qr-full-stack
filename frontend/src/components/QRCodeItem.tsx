import { useQuery } from '@tanstack/react-query';
import { getQrCodeByIDQueryOptions } from '@/lib/api';
import { QRTabs } from "@/components/qr-tabs";
interface QRCodeItemProps {
  id: string;
  text: string;
}

export function QRCodeItem({ id, text }: QRCodeItemProps) {
  const { data, isLoading } = useQuery(getQrCodeByIDQueryOptions(id));
  const serverFiles = data?.qrImages.map((image) => ({ name: image.imageName, blend: image.filter, url: image.url || `/api/uploads/${image.imageName}` })) || []
  return (
    <div>
      <QRTabs serverFiles={serverFiles} text={text} loading={isLoading} />
      {/* <ImageQRCodeCard title={text} image={data?.image || ""} /> */}
    </div>
  );
}
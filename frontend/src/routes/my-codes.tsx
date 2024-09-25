import { createFileRoute } from '@tanstack/react-router'
import { useLocalStorage } from "@/lib/useLocalStorage";
import { QRCodeItem } from "@/components/QRCodeItem";

export const Route = createFileRoute('/my-codes')({
  component: Index,
})

function Index() {
  const [allCodes] = useLocalStorage<{ id: string, text: string }[]>("codes", []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-foreground">All Codes</h1>
      <div className="flex flex-wrap gap-8 w-full items-center justify-center">
        {allCodes?.map((code) => (
          <QRCodeItem key={code.id} id={code.id} text={code.text} />
        ))}
      </div>
    </div>
  )
}

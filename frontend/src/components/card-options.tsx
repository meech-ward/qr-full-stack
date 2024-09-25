import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

type Value = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'

export function QROptions({onValueChange}: {onValueChange: (value: Value) => void}) {
  return (
    <Tabs defaultValue="square" onValueChange={onValueChange as (value: string) => void}>
      <TabsList>
        <TabsTrigger value="square">
          <div className="w-4 h-4 border-2 border-current"></div>
        </TabsTrigger>
        <TabsTrigger value="dots">
          <div className="w-4 h-4 rounded-full border-2 border-current"></div>
        </TabsTrigger>
        <TabsTrigger value="rounded">
          <div className="w-4 h-4 rounded-sm border-2 border-current"></div>
        </TabsTrigger>
        <TabsTrigger value="extra-rounded">
          <div className="w-4 h-4 rounded-md border-2 border-current"></div>
        </TabsTrigger>
        <TabsTrigger value="classy">
          <div className="w-4 h-4 border-2 border-current rounded-tl-md rounded-br-md"></div>
        </TabsTrigger>
        <TabsTrigger value="classy-rounded">
          <div className="w-4 h-4 border-2 border-current rounded-tl-lg rounded-br-lg"></div>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

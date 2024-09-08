import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeGenerator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="text"
        value={inputText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
        placeholder="Enter text for QR code"
        className="border border-gray-300 rounded px-3 py-2 w-64"
      />
      {inputText && (
        <div className="border border-gray-300 rounded p-4">
          <QRCodeSVG value={inputText} size={256} />
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
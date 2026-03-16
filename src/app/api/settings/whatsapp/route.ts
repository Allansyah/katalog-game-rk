import { NextResponse } from 'next/server';

// GET - Get admin WhatsApp number
export async function GET() {
  const whatsappNumber = process.env.ADMIN_WHATSAPP_NUMBER || '';
  
  return NextResponse.json({ 
    whatsappNumber,
    // Format for display: +62 812-3456-7890
    whatsappDisplay: whatsappNumber ? formatPhoneNumber(whatsappNumber) : '',
  });
}

function formatPhoneNumber(number: string): string {
  // Indonesian format: 6281234567890 -> +62 812-3456-7890
  if (number.startsWith('62') && number.length >= 10) {
    const withoutCountry = number.slice(2);
    return `+62 ${withoutCountry.slice(0, 3)}-${withoutCountry.slice(3, 7)}-${withoutCountry.slice(7)}`;
  }
  return `+${number}`;
}

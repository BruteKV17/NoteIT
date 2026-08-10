/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const RAZORPAY_KEY_ID = 'rzp_live_TOD97KDr57yuPX';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface OpenRazorpayOptions {
  amount: number; // In INR (e.g. 399)
  planName: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (paymentId: string) => void;
  onFailure?: (error: any) => void;
}

export async function openRazorpayCheckout({
  amount,
  planName,
  userName = 'Academic Scholar',
  userEmail = '',
  userPhone = '',
  onSuccess,
  onFailure
}: OpenRazorpayOptions) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    alert('Failed to load Razorpay payment SDK. Please verify your internet connection.');
    onFailure?.('SDK load failed');
    return;
  }

  const amountInPaise = Math.round(amount * 100); // 399 * 100 = 39900 paise

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amountInPaise,
    currency: 'INR',
    name: 'NoteIT AI',
    description: `${planName} Subscription Pass`,
    image: '/favicon.svg',
    handler: function (response: RazorpayPaymentSuccessResponse) {
      if (response && response.razorpay_payment_id) {
        onSuccess(response.razorpay_payment_id);
      }
    },
    prefill: {
      name: userName,
      email: userEmail,
      contact: userPhone
    },
    notes: {
      app_name: 'NoteIT AI',
      plan: planName
    },
    theme: {
      color: '#FFC400'
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      console.error('Razorpay Payment Failed:', response.error);
      alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      onFailure?.(response.error);
    });
    rzp.open();
  } catch (err) {
    console.error('Error opening Razorpay checkout:', err);
    alert('Could not initialize Razorpay checkout.');
    onFailure?.(err);
  }
}

import axios from 'axios';
import cryptoNode from 'crypto';

export async function sendEnterpriseAgeVerifyCallback(
    targetUrl: string,
    payload: { mail: string; userid: string | null; dob?: string | null; status: 'approved' | 'denied' },
    secretKey?: string
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'BeSafe-Enterprise-Verify/1.0',
      };
      if (secretKey) {
        const signature = cryptoNode
          .createHmac('sha256', secretKey)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Signature-SHA256'] = signature;
      }

      const response = await axios.post(targetUrl, payload, {
        headers,
        timeout: 10000,
        validateStatus: () => true
      });

      const isSuccess = response.status >= 200 && response.status < 300;
      return {
        success: isSuccess,
        statusCode: response.status,
        data: typeof response.data === 'string' ? response.data.slice(0, 500) : response.data
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: err.response?.status || 0,
        error: err.message || 'Failed to dispatch webhook callback'
      };
    }
  }

'use client';

import { useState, useEffect } from 'react';

type ConfigCategory = 'PAYMENT' | 'STORAGE' | 'SMS' | 'EMAIL' | 'SHIPPING' | 'SEARCH';

interface ProviderConfig {
  provider: string;
  credentials: Record<string, any>;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<ConfigCategory>('PAYMENT');
  const [configs, setConfigs] = useState<Record<ConfigCategory, ProviderConfig | null>>({
    PAYMENT: null,
    STORAGE: null,
    SMS: null,
    EMAIL: null,
    SHIPPING: null,
    SEARCH: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paymentProvider, setPaymentProvider] = useState('CASHFREE');
  const [paymentCreds, setPaymentCreds] = useState({ clientId: '', clientSecret: '', keyId: '', keySecret: '', secretKey: '' });

  const [storageProvider, setStorageProvider] = useState('SUPABASE');
  const [storageCreds, setStorageCreds] = useState({ url: '', bucket: '', serviceKey: '', accessKey: '', secretKey: '', cloudName: '', uploadPreset: '' });

  const [smsProvider, setSmsProvider] = useState('MSG91');
  const [smsCreds, setSmsCreds] = useState({ authKey: '', templateId: '', accountSid: '', authToken: '', phoneNumber: '', apiKey: '', senderId: '' });

  const [emailProvider, setEmailProvider] = useState('RESEND');
  const [emailCreds, setEmailCreds] = useState({ apiKey: '', fromEmail: '', host: '', port: '', username: '', password: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setConfigs(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      let config: any = {};

      switch (activeTab) {
        case 'PAYMENT':
          config = { provider: paymentProvider, credentials: paymentCreds };
          break;
        case 'STORAGE':
          config = { provider: storageProvider, credentials: storageCreds };
          break;
        case 'SMS':
          config = { provider: smsProvider, credentials: smsCreds };
          break;
        case 'EMAIL':
          config = { provider: emailProvider, credentials: emailCreds };
          break;
      }

      const response = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ category: activeTab, config }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Settings saved successfully! Changes are active immediately.');
        fetchSettings();
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">OneMartGo Admin Panel</h1>
          <p className="text-gray-400 text-sm">Super Admin Dashboard</p>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-gray-900 min-h-screen p-6">
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-lg bg-purple-600 text-white">
              ⚙️ Settings
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800">
              📊 Analytics
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800">
              👥 Users
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800">
              🏪 Vendors
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800">
              📦 Products
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800">
              🛒 Orders
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800">
              💰 Payouts
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Provider Settings</h2>
            <p className="text-gray-400 mb-6">
              ⚡ Change payment gateways, storage, SMS, email providers without code changes or redeployment.
              Changes take effect immediately!
            </p>

            <div className="flex border-b border-gray-800 mb-6">
              {(['PAYMENT', 'STORAGE', 'SMS', 'EMAIL', 'SHIPPING', 'SEARCH'] as ConfigCategory[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold ${
                    activeTab === tab
                      ? 'border-b-2 border-purple-500 text-purple-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'PAYMENT' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Payment Provider</label>
                  <select
                    value={paymentProvider}
                    onChange={(e) => setPaymentProvider(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="CASHFREE">Cashfree</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="STRIPE">Stripe</option>
                  </select>
                </div>

                {paymentProvider === 'CASHFREE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client ID</label>
                      <input
                        type="text"
                        value={paymentCreds.clientId}
                        onChange={(e) => setPaymentCreds({ ...paymentCreds, clientId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Cashfree Client ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Client Secret</label>
                      <input
                        type="password"
                        value={paymentCreds.clientSecret}
                        onChange={(e) => setPaymentCreds({ ...paymentCreds, clientSecret: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Cashfree Client Secret"
                      />
                    </div>
                  </>
                )}

                {paymentProvider === 'RAZORPAY' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Key ID</label>
                      <input
                        type="text"
                        value={paymentCreds.keyId}
                        onChange={(e) => setPaymentCreds({ ...paymentCreds, keyId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Razorpay Key ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Key Secret</label>
                      <input
                        type="password"
                        value={paymentCreds.keySecret}
                        onChange={(e) => setPaymentCreds({ ...paymentCreds, keySecret: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Razorpay Key Secret"
                      />
                    </div>
                  </>
                )}

                {paymentProvider === 'STRIPE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Secret Key</label>
                    <input
                      type="password"
                      value={paymentCreds.secretKey}
                      onChange={(e) => setPaymentCreds({ ...paymentCreds, secretKey: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Enter Stripe Secret Key"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'STORAGE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Storage Provider</label>
                  <select
                    value={storageProvider}
                    onChange={(e) => setStorageProvider(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="SUPABASE">Supabase Storage</option>
                    <option value="AWS_S3">AWS S3</option>
                    <option value="CLOUDINARY">Cloudinary</option>
                    <option value="BACKBLAZE">Backblaze B2</option>
                  </select>
                </div>

                {storageProvider === 'SUPABASE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Supabase URL</label>
                      <input
                        type="text"
                        value={storageCreds.url}
                        onChange={(e) => setStorageCreds({ ...storageCreds, url: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bucket Name</label>
                      <input
                        type="text"
                        value={storageCreds.bucket}
                        onChange={(e) => setStorageCreds({ ...storageCreds, bucket: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="media"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Service Role Key</label>
                      <input
                        type="password"
                        value={storageCreds.serviceKey}
                        onChange={(e) => setStorageCreds({ ...storageCreds, serviceKey: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Supabase Service Role Key"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'SMS' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SMS Provider</label>
                  <select
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="MSG91">MSG91</option>
                    <option value="TWILIO">Twilio</option>
                    <option value="FAST2SMS">Fast2SMS</option>
                  </select>
                </div>

                {smsProvider === 'MSG91' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Auth Key</label>
                      <input
                        type="password"
                        value={smsCreds.authKey}
                        onChange={(e) => setSmsCreds({ ...smsCreds, authKey: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter MSG91 Auth Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Template ID</label>
                      <input
                        type="text"
                        value={smsCreds.templateId}
                        onChange={(e) => setSmsCreds({ ...smsCreds, templateId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Template ID"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'EMAIL' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Provider</label>
                  <select
                    value={emailProvider}
                    onChange={(e) => setEmailProvider(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="RESEND">Resend</option>
                    <option value="SENDGRID">SendGrid</option>
                    <option value="SMTP">SMTP</option>
                  </select>
                </div>

                {emailProvider === 'RESEND' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                      <input
                        type="password"
                        value={emailCreds.apiKey}
                        onChange={(e) => setEmailCreds({ ...emailCreds, apiKey: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Enter Resend API Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">From Email</label>
                      <input
                        type="email"
                        value={emailCreds.fromEmail}
                        onChange={(e) => setEmailCreds({ ...emailCreds, fromEmail: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="noreply@onemartgo.com"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={saveConfig}
                disabled={saving}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : '💾 Save & Activate Immediately'}
              </button>
              <p className="text-sm text-gray-400 mt-2">
                ✨ All credentials are AES-256 encrypted in database. Changes take effect immediately without redeployment.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

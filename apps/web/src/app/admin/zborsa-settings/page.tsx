'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { 
  ZBORSA_CONSTANTS,
  ZBorsaSettings,
  TokenPair
} from '@obscuranet/shared';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ZBorsaSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ZBorsaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        const settingsDoc = await getDoc(doc(db, 'systemSettings', 'zborsa'));
        
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as ZBorsaSettings);
        } else {
          // Create default settings if not exist
          const defaultSettings: ZBorsaSettings = {
            id: 'zborsa',
            tokenPairs: ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS,
            dailySwapLimit: ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT,
            dailySwapLimitPerUser: ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT_PER_USER,
            globalSwapEnabled: true,
            stakingEnabled: true,
            stakingOptions: ZBORSA_CONSTANTS.DEFAULT_STAKING_OPTIONS,
            lastUpdatedBy: user?.id || 'system',
            updatedAt: new Date()
          };
          
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error('Error loading Z-Borsa settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // Save settings
  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Update the last updated info
      const updatedSettings: ZBorsaSettings = {
        ...settings,
        lastUpdatedBy: user?.id || 'unknown',
        updatedAt: new Date()
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'systemSettings', 'zborsa'), updatedSettings);
      
      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Error saving Z-Borsa settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Update token pair
  const updateTokenPair = (index: number, field: keyof TokenPair, value: any) => {
    if (!settings) return;
    
    const updatedPairs = [...settings.tokenPairs];
    updatedPairs[index] = {
      ...updatedPairs[index],
      [field]: field === 'isActive' ? Boolean(value) : Number(value)
    };
    
    setSettings({
      ...settings,
      tokenPairs: updatedPairs
    });
  };
  
  // Update global settings
  const updateGlobalSetting = (field: keyof ZBorsaSettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: value
    });
  };
  
  // Reset to default settings
  const resetToDefaults = () => {
    if (!user) return;
    
    const defaultSettings: ZBorsaSettings = {
      id: 'zborsa',
      tokenPairs: ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS,
      dailySwapLimit: ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT,
      dailySwapLimitPerUser: ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT_PER_USER,
      globalSwapEnabled: true,
      stakingEnabled: true,
      stakingOptions: ZBORSA_CONSTANTS.DEFAULT_STAKING_OPTIONS,
      lastUpdatedBy: user.id,
      updatedAt: new Date()
    };
    
    setSettings(defaultSettings);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Z-Borsa Settings
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={resetToDefaults}
                className="btn-secondary text-sm py-1"
                disabled={isSaving}
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                className="btn-primary text-sm py-1"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
            {success}
          </div>
        )}
        
        {/* Global Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Global Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Global Swap Enabled
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings?.globalSwapEnabled}
                  onChange={(e) => updateGlobalSetting('globalSwapEnabled', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable token swapping platform-wide
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Staking Enabled
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings?.stakingEnabled}
                  onChange={(e) => updateGlobalSetting('stakingEnabled', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable token staking platform-wide
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Swap Limit
              </label>
              <input
                type="number"
                value={settings?.dailySwapLimit || 0}
                onChange={(e) => updateGlobalSetting('dailySwapLimit', Number(e.target.value))}
                min="0"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of swaps per day across all users
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Swap Limit Per User
              </label>
              <input
                type="number"
                value={settings?.dailySwapLimitPerUser || 0}
                onChange={(e) => updateGlobalSetting('dailySwapLimitPerUser', Number(e.target.value))}
                min="0"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of swaps per day for each user
              </p>
            </div>
          </div>
        </div>
        
        {/* Token Pairs */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Token Pair Settings
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    From Token
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    To Token
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fee
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Min Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Max Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {settings?.tokenPairs.map((pair, index) => (
                  <tr key={`${pair.fromToken}-${pair.toToken}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pair.fromToken}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pair.toToken}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={pair.rate}
                        onChange={(e) => updateTokenPair(index, 'rate', e.target.value)}
                        step="0.001"
                        min="0.001"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={pair.fee}
                        onChange={(e) => updateTokenPair(index, 'fee', e.target.value)}
                        step="0.001"
                        min="0"
                        max="0.5"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={pair.minAmount}
                        onChange={(e) => updateTokenPair(index, 'minAmount', e.target.value)}
                        step="0.01"
                        min="0.01"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={pair.maxAmount}
                        onChange={(e) => updateTokenPair(index, 'maxAmount', e.target.value)}
                        step="1"
                        min="1"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={pair.isActive}
                        onChange={(e) => updateTokenPair(index, 'isActive', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Staking Options Settings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Staking Options
          </h2>
        </div>
        
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Stake Token
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Yield Token
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Yield Rate (APY)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Lock Period (Days)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Min Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Max Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {settings?.stakingOptions.map((option, index) => (
                  <tr key={`stake-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {option.tokenType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {option.yieldToken}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={option.yieldRate}
                        onChange={(e) => {
                          const updatedOptions = [...settings.stakingOptions];
                          updatedOptions[index] = {
                            ...option,
                            yieldRate: Number(e.target.value)
                          };
                          setSettings({ ...settings, stakingOptions: updatedOptions });
                        }}
                        step="0.01"
                        min="0.01"
                        max="1"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={option.lockPeriodDays}
                        onChange={(e) => {
                          const updatedOptions = [...settings.stakingOptions];
                          updatedOptions[index] = {
                            ...option,
                            lockPeriodDays: Number(e.target.value)
                          };
                          setSettings({ ...settings, stakingOptions: updatedOptions });
                        }}
                        step="1"
                        min="1"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={option.minAmount}
                        onChange={(e) => {
                          const updatedOptions = [...settings.stakingOptions];
                          updatedOptions[index] = {
                            ...option,
                            minAmount: Number(e.target.value)
                          };
                          setSettings({ ...settings, stakingOptions: updatedOptions });
                        }}
                        step="0.1"
                        min="0.1"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={option.maxAmount}
                        onChange={(e) => {
                          const updatedOptions = [...settings.stakingOptions];
                          updatedOptions[index] = {
                            ...option,
                            maxAmount: Number(e.target.value)
                          };
                          setSettings({ ...settings, stakingOptions: updatedOptions });
                        }}
                        step="1"
                        min="1"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
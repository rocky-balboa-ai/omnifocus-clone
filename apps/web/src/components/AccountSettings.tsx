'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, Key, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface AccountSettingsProps {
  currentUser: { id: string; username: string };
  theme: 'dark' | 'light';
}

export function AccountSettings({ currentUser, theme }: AccountSettingsProps) {
  // Username
  const [username, setUsername] = useState(currentUser.username);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // API Key
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ maskedKey: string }>('/auth/api-key').then((res) => {
      setMaskedKey(res.maskedKey);
    });
  }, []);

  const handleSaveUsername = async () => {
    setUsernameMessage(null);
    setIsSavingUsername(true);
    try {
      await api.patch('/auth/profile', { username });
      setUsernameMessage({ type: 'success', text: 'Username updated' });
    } catch (err: any) {
      setUsernameMessage({ type: 'error', text: err.message || 'Failed to update username' });
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevealKey = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      setRevealedKey(null);
      return;
    }
    const res = await api.get<{ apiKey: string }>('/auth/api-key/reveal');
    setRevealedKey(res.apiKey);
    setIsRevealed(true);
  };

  const handleCopyKey = async () => {
    const res = await api.get<{ apiKey: string }>('/auth/api-key/reveal');
    await navigator.clipboard.writeText(res.apiKey);
    setCopyMessage('Copied!');
    setTimeout(() => setCopyMessage(null), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure? This will invalidate your current API key.')) return;
    const res = await api.post<{ apiKey: string }>('/auth/api-key/regenerate');
    setRevealedKey(res.apiKey);
    setIsRevealed(true);
    // Update masked key display
    const masked = await api.get<{ maskedKey: string }>('/auth/api-key');
    setMaskedKey(masked.maskedKey);
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Username */}
      <section>
        <h3 className={clsx(
          'flex items-center gap-2 text-sm font-semibold mb-3',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          <User size={16} />
          Account
        </h3>
        <div className={clsx('p-3 rounded-lg', isDark ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface')}>
          <label className={clsx('text-sm block mb-1.5', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Username
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={clsx(
                'flex-1 px-3 py-2 rounded-lg border text-sm',
                isDark
                  ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              )}
            />
            <button
              onClick={handleSaveUsername}
              disabled={isSavingUsername || username === currentUser.username}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
              )}
            >
              Save
            </button>
          </div>
          {usernameMessage && (
            <p className={clsx('text-xs mt-2', usernameMessage.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {usernameMessage.text}
            </p>
          )}
        </div>
      </section>

      {/* Password */}
      <section>
        <div className={clsx('p-3 rounded-lg', isDark ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface')}>
          <label className={clsx('text-sm block mb-3 font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Change Password
          </label>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border text-sm',
                isDark
                  ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border text-sm',
                isDark
                  ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={clsx(
                'w-full px-3 py-2 rounded-lg border text-sm',
                isDark
                  ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              className={clsx(
                'w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
              )}
            >
              Change Password
            </button>
          </div>
          {passwordMessage && (
            <p className={clsx('text-xs mt-2', passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {passwordMessage.text}
            </p>
          )}
        </div>
      </section>

      {/* API Key */}
      <section>
        <h3 className={clsx(
          'flex items-center gap-2 text-sm font-semibold mb-3',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          <Key size={16} />
          API Key
        </h3>
        <div className={clsx('p-3 rounded-lg', isDark ? 'bg-omnifocus-surface' : 'bg-omnifocus-light-surface')}>
          <div className={clsx(
            'px-3 py-2 rounded-lg font-mono text-sm mb-3',
            isDark ? 'bg-omnifocus-bg text-gray-300' : 'bg-gray-100 text-gray-700'
          )}>
            {isRevealed && revealedKey ? revealedKey : maskedKey || 'Loading...'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRevealKey}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isDark
                  ? 'bg-omnifocus-bg text-gray-300 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              )}
              aria-label={isRevealed ? 'Hide' : 'Reveal'}
            >
              {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
              {isRevealed ? 'Hide' : 'Reveal'}
            </button>
            <button
              onClick={handleCopyKey}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isDark
                  ? 'bg-omnifocus-bg text-gray-300 hover:text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              )}
              aria-label="Copy"
            >
              <Copy size={14} />
              {copyMessage || 'Copy'}
            </button>
            <button
              onClick={handleRegenerateKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              aria-label="Regenerate"
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

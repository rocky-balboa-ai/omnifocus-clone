'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { CheckSquare } from 'lucide-react';
import clsx from 'clsx';

interface LoginFormProps {
  onSuccess: () => void;
}

interface LoginResponse {
  accessToken: string;
  user: { id: string; username: string };
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/auth/login', { username, password });
      localStorage.setItem('authToken', response.accessToken);
      onSuccess();
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-omnifocus-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-omnifocus-purple rounded-2xl mb-4">
            <CheckSquare size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OmniFocus Clone</h1>
          <p className="text-gray-400 mt-2">Sign in to manage your tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-omnifocus-surface rounded-xl p-6 border border-omnifocus-border">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-omnifocus-bg border border-omnifocus-border text-white placeholder-gray-500 focus:outline-none focus:border-omnifocus-purple transition-colors"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg bg-omnifocus-bg border border-omnifocus-border text-white placeholder-gray-500 focus:outline-none focus:border-omnifocus-purple transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className={clsx(
              'w-full mt-6 py-2.5 px-4 rounded-lg font-medium transition-all',
              'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Default: fred / omnifocus
        </p>
      </div>
    </div>
  );
}

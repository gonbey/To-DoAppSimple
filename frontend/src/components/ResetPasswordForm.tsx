import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { useNavigate, useSearchParams } from 'react-router-dom';

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail?.message || 'パスワードのリセットに失敗しました。');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('#/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードのリセットに失敗しました。');
    }
  };

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>無効なリセットリンクです。</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">パスワードのリセット</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="新しいパスワード"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>パスワードが正常に更新されました。ログインページにリダイレクトします。</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full">
          パスワードを更新
        </Button>
      </form>
    </div>
  );
}

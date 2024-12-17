import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Alert, AlertDescription } from "../components/ui/alert"

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setResetMessage('')

    try {
      console.log('Sending login request to:', `${import.meta.env.VITE_API_URL}/api/auth/login`);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include',
        body: JSON.stringify({ id, password }),
      })

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'ログインに失敗しました。')
      }

      localStorage.setItem('token', data.access_token)
      console.log('Token stored:', localStorage.getItem('token'));
      console.log('Current location before navigation:', window.location.href);
      console.log('Hash location before navigation:', window.location.hash);

      setSuccess('ログインに成功しました！')
      onLoginSuccess();
      console.log('Attempting navigation to /todos');
      navigate('/todos', { replace: true })
      console.log('Current location after navigation:', window.location.href);
      console.log('Hash location after navigation:', window.location.hash);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'ログインに失敗しました。')
    }
  }

  const handlePasswordReset = async () => {
    setError('')
    setSuccess('')
    setResetMessage('')
    setIsResetting(true)

    if (!id) {
      setError('パスワードをリセットするにはIDを入力してください。')
      setIsResetting(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'パスワードリセットのリクエストに失敗しました。')
      }

      const data = await response.json()
      if (data.reset_url) {
        setResetMessage(`${data.message}\n開発モード: ${data.reset_url}`);
      } else {
        setResetMessage(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードリセットのリクエストに失敗しました。')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="ユーザーID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {resetMessage && (
          <Alert>
            <AlertDescription>{resetMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Button type="submit" className="w-full">
            ログイン
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePasswordReset}
            disabled={isResetting}
          >
            {isResetting ? 'リセット中...' : 'パスワードを忘れた場合'}
          </Button>
        </div>
      </form>
    </div>
  )
}

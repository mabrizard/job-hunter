import React, { useState } from 'react'
import { signInWithEmail } from '../lib/sync'
import { Card, Button, Input, Alert } from './UI'

export default function AuthModal({ lang, onClose }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await signInWithEmail(email.trim())
      setSent(true)
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[16px] font-medium mb-1">
              {lang === 'fr' ? 'Synchronisation multi-appareils' : 'Multi-device sync'}
            </div>
            <div className="text-[12px] text-gray-500">
              {lang === 'fr'
                ? 'Connectez-vous pour accéder à votre pipeline depuis n\'importe quel appareil'
                : 'Sign in to access your pipeline from any device'}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {!sent ? (
          <>
            <div className="bg-[#EEEDFE] rounded-lg p-3 mb-4 text-[12px] text-[#534AB7]">
              <div className="font-medium mb-1">
                {lang === 'fr' ? 'Connexion sans mot de passe' : 'Passwordless sign in'}
              </div>
              {lang === 'fr'
                ? 'Entrez votre email — vous recevrez un lien magique. Vos données localStorage existantes seront automatiquement synchronisées.'
                : 'Enter your email — you\'ll receive a magic link. Your existing localStorage data will be automatically synced.'}
            </div>

            <div className="mb-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marc@example.com"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSubmit} disabled={loading || !email.trim()}>
                {loading
                  ? <><span className="spinner" />{lang === 'fr' ? 'Envoi…' : 'Sending…'}</>
                  : <><i className="ti ti-mail" />{lang === 'fr' ? 'Envoyer le lien' : 'Send magic link'}</>
                }
              </Button>
              <Button onClick={onClose}>
                {lang === 'fr' ? 'Continuer sans compte' : 'Continue without account'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">📬</div>
            <div className="text-[14px] font-medium mb-2">
              {lang === 'fr' ? 'Lien envoyé !' : 'Magic link sent!'}
            </div>
            <div className="text-[13px] text-gray-500 mb-4">
              {lang === 'fr'
                ? `Vérifiez votre boîte mail (${email}) et cliquez sur le lien pour vous connecter.`
                : `Check your inbox (${email}) and click the link to sign in.`}
            </div>
            <Button onClick={onClose}>
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

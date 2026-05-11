/**
 * components/ui/ErrorBoundary.tsx
 *
 * HCI Principle 4 — Error Recovery:
 * When Django is down or a component crashes, instead of
 * showing a blank white screen or Next.js default error page,
 * show a friendly recovery message with a retry button.
 *
 * This is a React Error Boundary — it catches any JavaScript
 * errors that bubble up from child components.
 *
 * Also exports ServerDownBanner for API fetch failures.
 */

import React from 'react'
import Link  from 'next/link'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    // In production this would log to a service like Sentry
    console.error('Racks Error Boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          minHeight:'50vh', display:'flex', alignItems:'center',
          justifyContent:'center', padding:'40px 20px', textAlign:'center',
        }}>
          <div>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚙️</div>
            <h2 style={{
              fontFamily:'sans-serif', fontSize:'20px',
              fontWeight:800, color:'#1A1A1A', marginBottom:'8px',
            }}>
              Something went wrong
            </h2>
            <p style={{ fontSize:'13px', color:'#78909C', marginBottom:'24px', lineHeight:1.6 }}>
              An unexpected error occurred on this page.<br/>
              Your cart and orders are safe.
            </p>
            <button
              onClick={() => { this.setState({ hasError:false }); window.location.reload() }}
              style={{
                background:'#0D1B2A', color:'#fff', border:'none',
                borderRadius:'8px', padding:'11px 24px',
                fontWeight:700, fontSize:'13px', cursor:'pointer',
                marginRight:'10px',
              }}
            >
              Reload Page
            </button>
            <Link href="/" style={{
              display:'inline-block',
              background:'#F9F6F1', color:'#1A1A1A',
              border:'1px solid #E4DDD3', borderRadius:'8px',
              padding:'11px 24px', fontWeight:700,
              fontSize:'13px', textDecoration:'none',
            }}>
              Back to Home
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}


/**
 * ServerDownBanner
 *
 * HCI Principle 4 — Error Recovery:
 * Shown at the top of the homepage when the Django API
 * cannot be reached. Tells the user what to do.
 *
 * Compare Dombelo: blank page or generic Next.js error.
 * Racks: specific message + retry button.
 */
export function ServerDownBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{
      background:'#FFF3E0', border:'1px solid #E65100',
      borderRadius:'10px', padding:'14px 18px',
      display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:'16px',
      margin:'16px 0',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
        <span style={{ fontSize:'20px', flexShrink:0 }}>⚠️</span>
        <div>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#E65100', marginBottom:'3px' }}>
            Could not connect to the server
          </div>
          <div style={{ fontSize:'12px', color:'#78909C', lineHeight:1.55 }}>
            Make sure Django is running: open a terminal, go to the{' '}
            <code style={{ background:'#F4EFE8', padding:'1px 5px', borderRadius:'4px', fontSize:'11px' }}>
              backend
            </code>{' '}
            folder and run{' '}
            <code style={{ background:'#F4EFE8', padding:'1px 5px', borderRadius:'4px', fontSize:'11px' }}>
              python manage.py runserver
            </code>
          </div>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            flexShrink:0, background:'#E65100', color:'#fff',
            border:'none', borderRadius:'7px', padding:'8px 16px',
            fontWeight:700, fontSize:'12px', cursor:'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
